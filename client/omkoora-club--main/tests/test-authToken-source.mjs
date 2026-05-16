#!/usr/bin/env node
/**
 * Source-level guard: ensures the real authToken.ts files keep the
 * constants and exports the contract test assumes. A drift here (e.g.
 * someone shortens REFRESH_LEAD_MS to seconds, or removes single-flight)
 * would silently regress the "stay-signed-in" behavior the unit test
 * cannot detect.
 *
 *   node tests/test-authToken-source.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const APPS = [
    "/Users/mw/Downloads/tomoh/client/omkoora-club--main",
    "/Users/mw/Downloads/tomoh/client/omkoora-team--main",
    "/Users/mw/Downloads/tomoh/client/super-admin",
    "/Users/mw/Downloads/tomoh/client/plyer",
];

const REQUIRED_TOKENS = [
    { name: "REFRESH_LEAD_MS literal (2 * 60 * 1000)", needle: "REFRESH_LEAD_MS = 2 * 60 * 1000" },
    { name: "MAX_TIMEOUT_MS literal (24h)", needle: "MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000" },
    { name: "STORAGE_KEY = omkoora.auth.token", needle: 'STORAGE_KEY = "omkoora.auth.token"' },
    { name: "single-flight via `inflight`", needle: "if (inflight) return inflight" },
    { name: "visibilitychange listener", needle: "visibilitychange" },
    { name: "applyNewToken exported", needle: "export const applyNewToken" },
    { name: "clearAuth exported", needle: "export const clearAuth" },
    { name: "runRefresh exported", needle: "export const runRefresh" },
    { name: "hydrateAuthFromStorage exported", needle: "export const hydrateAuthFromStorage" },
    { name: "persists to localStorage", needle: "localStorage.setItem(STORAGE_KEY" },
    { name: "removes from localStorage on clear", needle: "localStorage.removeItem(STORAGE_KEY" },
];

const FORBIDDEN_TOKENS = [
    // The pre-fix scheduler woke up every 45 seconds — must be gone.
    { name: "no 45-second setInterval pattern", needle: "1000*60*0.75" },
    { name: "no 45-second setInterval pattern (with spaces)", needle: "1000 * 60 * 0.75" },
];

let failed = 0;
const ok = (msg) => console.log(`  ok  ${msg}`);
const fail = (msg) => {
    console.log(`  FAIL ${msg}`);
    failed++;
};

for (const app of APPS) {
    const tokenFile = path.join(app, "lib/helpers/authToken.ts");
    const authFile = path.join(app, "lib/helpers/_auth.tsx");
    const graphqlFile = path.join(app, "lib/graphql.ts");
    const appName = path.basename(app);

    console.log(`\n[${appName}]`);

    if (!existsSync(tokenFile)) {
        fail(`missing ${tokenFile}`);
        continue;
    }
    const src = readFileSync(tokenFile, "utf8");

    for (const { name, needle } of REQUIRED_TOKENS) {
        src.includes(needle) ? ok(name) : fail(`${name} (looking for: ${needle})`);
    }
    for (const { name, needle } of FORBIDDEN_TOKENS) {
        !src.includes(needle) ? ok(name) : fail(`${name} — found stale code`);
    }

    // _auth.tsx should no longer hold the 45s setInterval either.
    if (existsSync(authFile)) {
        const authSrc = readFileSync(authFile, "utf8");
        !authSrc.includes("1000*60*0.75") && !authSrc.includes("1000 * 60 * 0.75")
            ? ok("_auth.tsx — no stale 45s interval")
            : fail("_auth.tsx still has 1000*60*0.75 setInterval");
        authSrc.includes("hydrateAuthFromStorage")
            ? ok("_auth.tsx imports hydrateAuthFromStorage")
            : fail("_auth.tsx missing hydrateAuthFromStorage call");
    }

    // graphql.ts must wire the refresh fn + unauth handler exactly once.
    if (existsSync(graphqlFile)) {
        const gSrc = readFileSync(graphqlFile, "utf8");
        gSrc.includes("registerRefreshFn(refreshAccessToken)")
            ? ok("graphql.ts registers refresh fn")
            : fail("graphql.ts missing registerRefreshFn(refreshAccessToken)");
        gSrc.includes("setUnauthenticatedHandler")
            ? ok("graphql.ts sets unauth handler")
            : fail("graphql.ts missing setUnauthenticatedHandler");
        gSrc.includes("fromPromise(runRefresh())")
            ? ok("graphql.ts errorLink uses shared runRefresh()")
            : fail("graphql.ts errorLink not wired to runRefresh()");
    }
}

console.log(`\n${failed === 0 ? "All source guards passed." : `${failed} guard(s) failed.`}\n`);
process.exit(failed === 0 ? 0 : 1);
