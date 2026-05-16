#!/usr/bin/env node
/**
 * Verifies that the JWT helpers issue tokens with the intended lifetimes
 * after the "stay-signed-in" change (access=7d, refresh=90d).
 *
 *   node tests/test-auth-lifetimes.mjs
 *
 * No DB or HTTP — imports the real modules and decodes what they sign.
 * SECRET_JWT must be set (loaded automatically from .env via dotenv).
 */
import jwt from "jsonwebtoken";
import {
    ACCESS_TOKEN_HOURS,
    REFRESH_TOKEN_DAYS,
    refreshCookieOptions,
} from "../src/Config/runtime.mjs";
import { AuthToken, RefreshToken, VerifyToken } from "../src/Helpers/JWT.mjs";

let failed = 0;
const assert = (name, cond, detail = "") => {
    if (cond) {
        console.log(`  ok  ${name}`);
    } else {
        console.log(`  FAIL ${name}${detail ? "  — " + detail : ""}`);
        failed++;
    }
};

const approxEqual = (a, b, tolerancePct = 0.01) =>
    Math.abs(a - b) <= Math.abs(b) * tolerancePct;

const stripBearer = (raw) => (raw.startsWith("Bearer ") ? raw.slice(7) : raw);

const decode = (raw) => jwt.decode(stripBearer(raw));

console.log("\n[1] runtime.mjs constants");
assert("ACCESS_TOKEN_HOURS = 168 (7 days)", ACCESS_TOKEN_HOURS === 168, `got ${ACCESS_TOKEN_HOURS}`);
assert("REFRESH_TOKEN_DAYS = 90", REFRESH_TOKEN_DAYS === 90, `got ${REFRESH_TOKEN_DAYS}`);
assert(
    "refresh cookie maxAge = 90 days in ms",
    refreshCookieOptions.maxAge === 90 * 24 * 3600 * 1000,
    `got ${refreshCookieOptions.maxAge}`,
);
assert("cookie httpOnly", refreshCookieOptions.httpOnly === true);
assert("cookie path = /", refreshCookieOptions.path === "/");

console.log("\n[2] AuthToken — default lifetime");
const accessRaw = await AuthToken({ id: "u-1", role: "admin" }, undefined, "club");
const accessDecoded = decode(accessRaw);
const accessTtlSec = accessDecoded.exp - accessDecoded.iat;
assert("Bearer prefix present", accessRaw.startsWith("Bearer "));
assert(
    "exp - iat ≈ 7 days (604,800s)",
    approxEqual(accessTtlSec, 7 * 24 * 3600),
    `got ${accessTtlSec}s = ${(accessTtlSec / 86400).toFixed(2)} days`,
);
assert("payload.id preserved", accessDecoded.id === "u-1");
assert("payload.role preserved", accessDecoded.role === "admin");
assert("aud = 'club' when appKey passed", accessDecoded.aud === "club");

console.log("\n[3] AuthToken — explicit expiresHours overrides default");
const shortRaw = await AuthToken({ id: "u-2" }, 1, "team");
const shortDecoded = decode(shortRaw);
const shortTtlSec = shortDecoded.exp - shortDecoded.iat;
assert(
    "explicit 1h → exp-iat ≈ 3600s",
    approxEqual(shortTtlSec, 3600),
    `got ${shortTtlSec}s`,
);

console.log("\n[4] RefreshToken — 90-day lifetime + aud + useragent flattening");
const refreshRaw = await RefreshToken(
    { id: "u-3", useragent: { browser: "Chrome", version: "121", platform: "MacIntel", os: "macOS", source: "test" } },
    "player",
);
const refreshDecoded = decode(refreshRaw);
const refreshTtlSec = refreshDecoded.exp - refreshDecoded.iat;
assert(
    "exp - iat ≈ 90 days (7,776,000s)",
    approxEqual(refreshTtlSec, 90 * 24 * 3600),
    `got ${refreshTtlSec}s = ${(refreshTtlSec / 86400).toFixed(2)} days`,
);
assert("aud = 'player'", refreshDecoded.aud === "player");
assert(
    "useragent flattened to string",
    typeof refreshDecoded.useragent === "string" && refreshDecoded.useragent.includes("Chrome"),
);

console.log("\n[5] VerifyToken");
const verified = await VerifyToken(stripBearer(accessRaw));
assert("verifies a valid access token", verified && verified.id === "u-1");
const bad = await VerifyToken("not.a.jwt");
assert("returns null on garbage", bad === null);

const expiredRaw = jwt.sign({ id: "u-x" }, process.env.SECRET_JWT, { expiresIn: -10 });
const expired = await VerifyToken(expiredRaw);
assert("returns null on expired token", expired === null);

console.log("\n[6] Refresh-cookie lifetime ≥ refresh-token JWT lifetime");
assert(
    "cookie outlives the JWT it carries",
    refreshCookieOptions.maxAge >= REFRESH_TOKEN_DAYS * 24 * 3600 * 1000,
);

console.log(`\n${failed === 0 ? "All checks passed." : `${failed} check(s) failed.`}\n`);
process.exit(failed === 0 ? 0 : 1);
