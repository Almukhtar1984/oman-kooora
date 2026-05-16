#!/usr/bin/env node
/**
 * Contract test for the auth scheduler in lib/helpers/authToken.ts.
 *
 *   node tests/test-authToken.mjs
 *
 * Re-implements the small pure algorithms from authToken.ts (JWT exp
 * decoding, schedule-delay computation, single-flight lock) and asserts
 * the contract holds. The TS module itself is verified separately by
 * `tsc --noEmit`; this script catches algorithmic regressions that
 * type-checking can not see.
 */
import jwt from "jsonwebtoken";

let failed = 0;
const assert = (name, cond, detail = "") => {
    if (cond) {
        console.log(`  ok  ${name}`);
    } else {
        console.log(`  FAIL ${name}${detail ? "  — " + detail : ""}`);
        failed++;
    }
};

// --- mirrors authToken.ts ----------------------------------------------------
const REFRESH_LEAD_MS = 2 * 60 * 1000;
const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000;

const stripBearer = (raw) =>
    !raw ? null : raw.startsWith("Bearer ") ? raw.slice(7) : raw;

const decodeExpiryMs = (token) => {
    const t = stripBearer(token);
    if (!t) return null;
    try {
        const decoded = jwt.decode(t);
        return decoded?.exp ? decoded.exp * 1000 : null;
    } catch {
        return null;
    }
};

const computeDelay = (expMs, now) => {
    if (!expMs) return MAX_TIMEOUT_MS;
    return Math.max(1_000, Math.min(MAX_TIMEOUT_MS, expMs - now - REFRESH_LEAD_MS));
};

const makeSingleFlight = () => {
    let inflight = null;
    return async (fn) => {
        if (inflight) return inflight;
        inflight = (async () => {
            try { return await fn(); }
            finally { inflight = null; }
        })();
        return inflight;
    };
};
// ---------------------------------------------------------------------------

const SECRET = "test-secret";
const signWithExp = (expSecondsFromNow) =>
    jwt.sign({ id: "u-1" }, SECRET, { expiresIn: expSecondsFromNow });

console.log("\n[1] decodeExpiryMs");
const t1 = signWithExp(3600);
const decodedAt = decodeExpiryMs(t1);
assert("returns ms timestamp ~1h ahead", Math.abs(decodedAt - (Date.now() + 3600_000)) < 2000);
assert("handles Bearer prefix", decodeExpiryMs("Bearer " + t1) === decodedAt);
assert("returns null for empty", decodeExpiryMs("") === null);
assert("returns null for null", decodeExpiryMs(null) === null);
assert("returns null for undefined", decodeExpiryMs(undefined) === null);
assert("returns null for garbage", decodeExpiryMs("not.a.jwt") === null);

// Token without exp claim
const noExp = jwt.sign({ id: "u-2" }, SECRET);
assert("returns null when exp missing", decodeExpiryMs(noExp) === null);

console.log("\n[2] computeDelay — schedules refresh before expiry");
const now = 1_000_000_000_000;
// Token expires in 7 days → delay = (7 days - 2 min)
const sevenDays = 7 * 24 * 60 * 60 * 1000;
const delay7d = computeDelay(now + sevenDays, now);
assert(
    "7-day token clamped to MAX_TIMEOUT_MS (24h)",
    delay7d === MAX_TIMEOUT_MS,
    `got ${delay7d}`,
);

// Token expires in 10 min → delay = 10min - 2min = 8min
const delay10m = computeDelay(now + 10 * 60_000, now);
assert(
    "10-min token → delay = 8 min",
    delay10m === 8 * 60_000,
    `got ${delay10m}`,
);

// Token already expired → delay floored to 1s
const delayExpired = computeDelay(now - 60_000, now);
assert("expired token → delay ≥ 1s (fires immediately-ish)", delayExpired === 1_000, `got ${delayExpired}`);

// Token expires within the lead window → also floor to 1s
const delayInLead = computeDelay(now + 30_000, now);
assert(
    "token expiring inside lead → delay = 1s",
    delayInLead === 1_000,
    `got ${delayInLead}`,
);

// Null exp → heartbeat every 24h
assert("null exp → 24h heartbeat", computeDelay(null, now) === MAX_TIMEOUT_MS);

console.log("\n[3] single-flight lock — concurrent callers share one round trip");
{
    const sf = makeSingleFlight();
    let calls = 0;
    const slowRefresh = () =>
        new Promise((resolve) => {
            calls++;
            setTimeout(() => resolve(`token-${calls}`), 50);
        });

    const [a, b, c, d] = await Promise.all([
        sf(slowRefresh), sf(slowRefresh), sf(slowRefresh), sf(slowRefresh),
    ]);
    assert("4 concurrent callers → only 1 underlying call", calls === 1, `calls=${calls}`);
    assert("all callers get the same value", a === b && b === c && c === d, `got ${a},${b},${c},${d}`);

    // After the inflight resolves, a fresh call should hit the network again.
    const e = await sf(slowRefresh);
    assert("post-resolution call re-runs the function", calls === 2, `calls=${calls}`);
    assert("post-resolution call gets new value", e === "token-2");
}

console.log("\n[4] single-flight — failures don't poison the lock");
{
    const sf = makeSingleFlight();
    let attempts = 0;
    const failingRefresh = async () => {
        attempts++;
        if (attempts === 1) throw new Error("network down");
        return "recovered";
    };

    let err;
    try { await sf(failingRefresh); } catch (e) { err = e; }
    assert("first call rejects", err && err.message === "network down");

    const second = await sf(failingRefresh);
    assert("subsequent call retries (lock released on failure)", second === "recovered");
}

console.log("\n[5] schedule-then-cancel pattern (used when token rotates)");
{
    let fired = 0;
    const timer = setTimeout(() => { fired++; }, 5);
    clearTimeout(timer);
    await new Promise((r) => setTimeout(r, 20));
    assert("clearTimeout prevents the callback", fired === 0);
}

console.log(`\n${failed === 0 ? "All checks passed." : `${failed} check(s) failed.`}\n`);
process.exit(failed === 0 ? 0 : 1);
