#!/usr/bin/env node
/**
 * Static guard for the academies module (standalone academy units with their
 * own owner account, role 7) across the backend and the academy dashboard.
 * Locks in the behaviours the feature promises and the invariants that keep it
 * additive & non-breaking:
 *
 *   1. Role 7 = academy owner; provisionAcademyOwner is super-admin-only (role 1).
 *   2. Ownership: Academy.id_user + association; owner queries are @auth and
 *      scoped to the signed-in owner (myAcademies/… never build an undefined WHERE).
 *   3. Public (mobile) surface is token-less: academies/academy/academyPrograms/
 *      academyNews/allAcademyNews and createAcademyRegistration carry NO @auth.
 *   4. A new registration raises an owner-targeted Notification + best-effort push.
 *   5. Owner write/management mutations are ownership-guarded (FORBIDDEN).
 *   6. Idempotent migration creates the four tables.
 *   7. The dashboard (academy.omkooora.com / :3055) is wired to these ops.
 *
 * Pure text checks: no DB, no network. Run with:
 *   node tests/test-academy-flow.mjs
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m" };
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);

let failures = 0;
const assert = (cond, msg) => {
    if (cond) ok(msg);
    else { bad(msg); failures++; }
};

// Monorepo root is two levels up from omkoora-backend--main/tests.
const root = resolve(__dirname, "..", "..");
const read = (...parts) => {
    try { return readFileSync(resolve(root, ...parts), "utf8"); }
    catch { return ""; }
};

const BE = "omkoora-backend--main";
const section = (t) => console.log(`\n${c.cyan}${t}${c.reset}`);

// ---------------------------------------------------------------------------
section("Models");
const mAcademy = read(BE, "src/Models/Academy.mjs");
const mProgram = read(BE, "src/Models/AcademyProgram.mjs");
const mNews = read(BE, "src/Models/AcademyNews.mjs");
const mReg = read(BE, "src/Models/AcademyRegistration.mjs");
const mIndex = read(BE, "src/Models/index.mjs");

assert(/tableName:\s*['"]academies['"]/.test(mAcademy), "Academy → table 'academies'");
assert(/paranoid:\s*true/.test(mAcademy), "Academy is paranoid (soft delete)");
assert(/tableName:\s*['"]academy_programs['"]/.test(mProgram), "AcademyProgram → table 'academy_programs'");
assert(/tableName:\s*['"]academy_news['"]/.test(mNews), "AcademyNews → table 'academy_news'");
assert(/tableName:\s*['"]academy_registrations['"]/.test(mReg), "AcademyRegistration → table 'academy_registrations'");
assert(/values:\s*\[\s*['"]waiting['"]\s*,\s*['"]accepted['"]\s*,\s*['"]rejected['"]/.test(mReg), "registration status enum waiting|accepted|rejected");
assert(/payment_status/.test(mReg) && /['"]unpaid['"]/.test(mReg) && /['"]paid['"]/.test(mReg), "registration payment_status unpaid|paid (cash on receipt)");

assert(/User\.hasMany\(Academy[\s\S]*?onDelete:\s*'SET NULL'/.test(mIndex), "User 1→* Academy (id_user, SET NULL)");
assert(/Academy\.hasMany\(AcademyProgram[\s\S]*?onDelete:\s*'CASCADE'/.test(mIndex), "Academy 1→* AcademyProgram (CASCADE)");
assert(/Academy\.hasMany\(AcademyNews[\s\S]*?onDelete:\s*'CASCADE'/.test(mIndex), "Academy 1→* AcademyNews (CASCADE)");
assert(/Academy\.hasMany\(AcademyRegistration[\s\S]*?onDelete:\s*'CASCADE'/.test(mIndex), "Academy 1→* AcademyRegistration (CASCADE)");
assert(/AcademyProgram\.hasMany\(AcademyRegistration[\s\S]*?onDelete:\s*'SET NULL'/.test(mIndex), "AcademyProgram 1→* AcademyRegistration (SET NULL)");
assert(/Academy,\s*AcademyProgram,\s*AcademyNews,\s*AcademyRegistration/.test(mIndex), "4 models exported from Models/index");

// ---------------------------------------------------------------------------
section("Schema (auth boundary)");
const sch = read(BE, "src/Graphql/Schemas/Academy.mjs");
// Helper: the single schema line that declares a given field.
const line = (name) => (sch.split("\n").find((l) => new RegExp(`\\b${name}\\b`).test(l)) || "");

// Public (mobile, token-less) — must NOT be @auth.
for (const q of ["academies", "academy", "academyPrograms", "academyNews", "allAcademyNews", "createAcademyRegistration"]) {
    assert(line(q) !== "" && !/@auth/.test(line(q)), `public '${q}' is token-less (no @auth)`);
}
// Owner dashboard — must be @auth.
for (const q of ["myAcademies", "myAcademyPrograms", "myAcademyNews", "myAcademyRegistrations", "myAcademyReport",
    "provisionAcademyOwner", "createAcademy", "updateAcademy", "deleteAcademy",
    "updateAcademyRegistrationStatus", "updateAcademyRegistrationPayment"]) {
    assert(/@auth/.test(line(q)), `owner '${q}' requires @auth`);
}
assert(/typeDefsAcademy/.test(read(BE, "src/Graphql/Schemas/index.mjs")), "Academy typeDefs registered in Schemas/index");
assert(/resolversAcademy/.test(read(BE, "src/Graphql/Resolvers/index.mjs")), "Academy resolvers registered in Resolvers/index");
const gidx = read(BE, "src/Graphql/index.mjs");
assert(/typeDefsAcademy/.test(gidx) && /resolversAcademy/.test(gidx), "Academy wired into the executable schema");

// ---------------------------------------------------------------------------
section("Resolvers (guards & behaviour)");
const res = read(BE, "src/Graphql/Resolvers/Academy.mjs");
assert(/ACADEMY_OWNER_ROLE\s*=\s*["']7["']/.test(res), "academy owner role = '7'");
assert(/caller\.role\s*!==\s*SUPER_ADMIN_ROLE/.test(res), "provisionAcademyOwner is super-admin-only");
assert(/requireOwnedAcademy/.test(res) && /"FORBIDDEN"/.test(res), "ownership guard throws FORBIDDEN");
// Owner-scoped reads never build an undefined WHERE: they bail to [] first.
assert(/if\s*\(ids\.length\s*===\s*0\)\s*return\s*\[\]/.test(res), "owner reads return [] when the owner has no academies");
assert(/if\s*\(!user\)\s*return\s*\[\]/.test(res), "owner reads return [] when unauthenticated");
// New registration → owner notification + push.
const regFn = (() => {
    const m = res.match(/createAcademyRegistration:\s*async[\s\S]*?\n {4}},/);
    return m ? m[0] : "";
})();
assert(/Notification\.create\(\s*\{\s*body,\s*id_user:\s*academy\.id_user/.test(regFn), "registration creates owner-targeted Notification");
assert(/sendPushToUser\(academy\.id_user/.test(regFn), "registration fires best-effort push to owner");
assert(/wrap\(error\)/.test(res) && /extensions\?\.code/.test(res), "coded errors (FORBIDDEN/…) survive catch, not masked");

// ---------------------------------------------------------------------------
section("Migration & config");
const sql = read(BE, "deploy/sql/2026-10-14_academies.sql");
for (const t of ["academies", "academy_programs", "academy_news", "academy_registrations"]) {
    assert(new RegExp(`CREATE TABLE IF NOT EXISTS\\s+\`${t}\``).test(sql), `migration creates '${t}' (idempotent)`);
}
const rt = read(BE, "src/Config/runtime.mjs");
assert(/academy:\s*\[/.test(rt) && /academy\.omkooora\.com/.test(rt), "runtime appKey map has academy origin");
assert(/academy\.omkooora\.com/.test(rt.split("appOrigins")[0]), "academy origin in CORS allowlist");

// ---------------------------------------------------------------------------
section("Dashboard (academy.omkooora.com / :3055)");
const APP = "client/omkoora-academy--main";
const pkg = read(APP, "package.json");
assert(/"name":\s*"omkoora-academy"/.test(pkg), "dashboard package is omkoora-academy");
assert(/-p\s*3055/.test(pkg), "dashboard dev/start on port 3055");
const pages = read(APP, "pages/index.js");
const login = read(APP, "pages/login.js");
assert(/authenticateUser/.test(login), "login uses authenticateUser");
for (const op of ["myAcademies", "myAcademyRegistrations", "myAcademyReport", "createAcademy",
    "updateAcademyRegistrationStatus", "updateAcademyRegistrationPayment", "allNotificationUser"]) {
    assert(pages.includes(op), `dashboard wires '${op}'`);
}

// ---------------------------------------------------------------------------
console.log(`\n${failures === 0 ? c.green + "ALL PASSED" : c.red + failures + " FAILED"}${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
