/**
 * Create (or reset the password of) a STADIUM-OWNER login (role 6) directly on
 * the server — no super-admin token needed (runs against the DB via the models,
 * bypassing the GraphQL @auth wall).
 *
 * Usage (on the server, inside omkoora-backend--main):
 *   node scripts/seed-stadium-owner.mjs
 *   STADIUM_OWNER_EMAIL=owner1@omkooora.com node scripts/seed-stadium-owner.mjs
 *   STADIUM_OWNER_EMAIL=owner1@omkooora.com STADIUM_OWNER_PASSWORD='MyPass123' node scripts/seed-stadium-owner.mjs
 *
 * If STADIUM_OWNER_PASSWORD is omitted, a strong random password is generated
 * and printed. Idempotent: keyed on the email (re-running resets the password).
 * The owner can change it later from the dashboard ("تغيير كلمة المرور").
 */
import crypto from "crypto";
import db from "../src/Config/DBContact.mjs";
import { User, Permission } from "../src/Models/index.mjs";
import { hashPassword } from "../src/Helpers/Password.mjs";

const STADIUM_OWNER_ROLE = "6";
const FULL_GRANT = "1,2,3,4,5,6,7,8,9,10";

const EMAIL = (process.env.STADIUM_OWNER_EMAIL || "stadium1@omkooora.com").trim().toLowerCase();

// Readable strong password: letters + digits + a symbol, no ambiguous chars.
const genPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let s = "";
    for (let i = 0; i < 10; i++) s += chars[crypto.randomInt(chars.length)];
    return s + "#" + crypto.randomInt(10) + crypto.randomInt(10);
};

const run = async () => {
    const password = process.env.STADIUM_OWNER_PASSWORD && process.env.STADIUM_OWNER_PASSWORD.length >= 6
        ? process.env.STADIUM_OWNER_PASSWORD
        : genPassword();

    await db.authenticate();

    let user = await User.findOne({ where: { email: EMAIL } });
    if (user) {
        if (user.role !== STADIUM_OWNER_ROLE) {
            throw new Error(`البريد ${EMAIL} مستخدم لحساب آخر (role ${user.role}) — اختر بريدًا غيره.`);
        }
        await User.update(
            { password: await hashPassword(password), role: STADIUM_OWNER_ROLE, activation: true, email_verify: true },
            { where: { id: user.id } }
        );
        console.log(`\n✅ أُعيد ضبط كلمة مرور صاحب الملعب.`);
    } else {
        user = await User.create({
            email: EMAIL,
            password: await hashPassword(password),
            role: STADIUM_OWNER_ROLE,
            activation: true,
            email_verify: true,
        });
        // Permission row (the dashboard doesn't gate on it, but keep it consistent).
        await Permission.create({ id_user: user.id, teams: FULL_GRANT }).catch(() => {});
        console.log(`\n✅ أُنشئ حساب صاحب ملعب جديد.`);
    }

    console.log("────────────────────────────────────");
    console.log(`  اللوحة:   https://stadium.omkooora.com`);
    console.log(`  اليوزر:   ${EMAIL}`);
    console.log(`  الباسورد: ${password}`);
    console.log("────────────────────────────────────");
    console.log("شاركها مع صاحب الملعب؛ يغيّر كلمة المرور من اللوحة بعد الدخول.");
    await db.close();
};

run().catch(async (e) => { console.error("فشل:", e?.message || e); try { await db.close(); } catch {} process.exit(1); });
