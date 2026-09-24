// Firebase Admin bootstrap for FCM push notifications.
//
// The service-account credentials are a SECRET and are never committed. Provide
// them on the server in ONE of these ways:
//   - FIREBASE_SERVICE_ACCOUNT       : the serviceAccountKey.json contents, as a
//                                      single-line JSON string or base64 of it.
//   - FIREBASE_SERVICE_ACCOUNT_PATH  : absolute path to serviceAccountKey.json
//                                      stored OUTSIDE the repository.
//
// Everything here is best-effort: if firebase-admin is not installed yet, or no
// credentials are configured, push is disabled and the rest of the app keeps
// working. Nothing throws at import time.

import fs from "fs";
import logger from "./logger.mjs";
import { User } from "../Models/index.mjs";

let messaging = null;   // admin.messaging() once initialised
let initTried = false;

const loadServiceAccount = () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw && raw.trim()) {
        const text = raw.trim().startsWith("{")
            ? raw
            : Buffer.from(raw, "base64").toString("utf8");
        return JSON.parse(text);
    }
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (path && fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path, "utf8"));
    }
    return null;
};

// Lazily initialise on first use so import never blocks startup.
const getMessaging = async () => {
    if (messaging || initTried) return messaging;
    initTried = true;
    try {
        const serviceAccount = loadServiceAccount();
        if (!serviceAccount) {
            logger.info("FCM disabled: no FIREBASE_SERVICE_ACCOUNT[_PATH] configured.");
            return null;
        }
        // Dynamic import so a missing dependency never crashes the app.
        const admin = (await import("firebase-admin")).default;
        if (!admin.apps.length) {
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
        messaging = admin.messaging();
        logger.info("FCM initialised.");
        return messaging;
    } catch (error) {
        logger.error(`FCM init failed (push disabled): ${error?.message}`);
        return null;
    }
};

// Whether push is (or can be) configured — used to short-circuit callers.
export const isPushConfigured = () =>
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

// Send one push to a single device token. Never throws; returns true on success.
export const sendPushToToken = async (token, { title, body, data } = {}) => {
    try {
        if (!token) return false;
        const m = await getMessaging();
        if (!m) return false;
        await m.send({
            token,
            notification: { title: title || "", body: body || "" },
            // FCM data values must be strings.
            data: Object.fromEntries(
                Object.entries(data || {}).map(([k, v]) => [k, String(v)])
            ),
        });
        return true;
    } catch (error) {
        logger.error(`sendPushToToken failed: ${error?.message}`);
        return false;
    }
};

// Look up a user's stored FCM token and push to it. Safe no-op when the user
// has no token or push is not configured.
export const sendPushToUser = async (userId, payload = {}) => {
    try {
        if (!userId || !isPushConfigured()) return false;
        const user = await User.findByPk(userId, { attributes: ["id", "fcm_token"] });
        if (!user?.fcm_token) return false;
        return await sendPushToToken(user.fcm_token, payload);
    } catch (error) {
        logger.error(`sendPushToUser failed: ${error?.message}`);
        return false;
    }
};
