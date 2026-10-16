// Symmetric encryption for secrets stored at rest (e.g. AI provider API keys).
// AES-256-GCM with a key derived from AI_ENC_KEY (or SECRET_JWT as a fallback).
// Ciphertext format: v1:<ivB64>:<tagB64>:<dataB64>. Never log plaintext keys.
import crypto from "crypto";

const RAW = process.env.AI_ENC_KEY || process.env.SECRET_JWT || "";
// 32-byte key regardless of the source length.
const KEY = crypto.createHash("sha256").update(String(RAW)).digest();
const PREFIX = "v1";

export const isEncryptionConfigured = () => Boolean(RAW);

export const encryptSecret = (plain) => {
    if (plain === null || plain === undefined || plain === "") return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
    const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [PREFIX, iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
};

export const decryptSecret = (payload) => {
    if (!payload) return null;
    try {
        const [prefix, ivB64, tagB64, dataB64] = String(payload).split(":");
        if (prefix !== PREFIX) return null;
        const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivB64, "base64"));
        decipher.setAuthTag(Buffer.from(tagB64, "base64"));
        const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
        return dec.toString("utf8");
    } catch {
        return null; // wrong key / tampered / legacy value
    }
};

// Short, safe hint for the UI ("sk-…AB12") without exposing the secret.
export const maskSecret = (plain) => {
    if (!plain) return null;
    const s = String(plain);
    if (s.length <= 6) return "••••";
    return s.slice(0, 3) + "…" + s.slice(-3);
};
