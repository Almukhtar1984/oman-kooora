#!/usr/bin/env node
/**
 * Guards that every print button in the team app points at a route that ACTUALLY
 * EXISTS in the print app. The print app was refactored (team-cards, match-list,
 * team-roster, league-list…) but the team app kept opening the old route names
 * (Participating/player, matchplayerlist, participating-player, …) — which the
 * HashRouter has no match for, so the print tab came up blank.
 *
 * Cross-checks the used routes against print/src/index.tsx so this can't drift
 * again, plus pins the specific fixes.
 *
 *   node tests/test-team-print-routes.mjs
 */

import { readFileSync, readdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m" };
const ok  = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);
let failures = 0;
const assert = (cond, msg) => { if (cond) ok(msg); else { bad(msg); failures++; } };

const root = resolve(__dirname, "..", "..");
const read = (...p) => { try { return readFileSync(resolve(root, ...p), "utf8"); } catch { return ""; } };

// ── Registered print routes ──────────────────────────────────────────────────
const printIndex = read("client", "print", "src", "index.tsx");
const registered = new Set();
let hasRootRoute = false;
for (const m of printIndex.matchAll(/path="\/([^"]*)"/g)) {
    const first = m[1].split("/")[0];
    if (first.startsWith(":")) hasRootRoute = true;   // "/:id" — a single-segment id
    else registered.add(first);
}

console.log(`${c.cyan}▶ Print app route table parsed${c.reset}`);
assert(registered.has("team-cards"), "team-cards route exists");
assert(registered.has("match-list"), "match-list route exists");
assert(registered.has("team-staff-cards"), "team-staff-cards route exists");
assert(hasRootRoute, "root /:id route exists (single card)");

// ── Every team-app print route must exist ────────────────────────────────────
const scanDirs = [
    ["client", "omkoora-team--main", "components", "Modal"],
    ["client", "omkoora-team--main", "components", "Tables"],
    ["client", "omkoora-team--main", "components", "Card"],
];
const usedStatic = new Set();
for (const parts of scanDirs) {
    let files = [];
    try { files = readdirSync(resolve(root, ...parts)).filter(f => f.endsWith(".tsx")); } catch {}
    for (const f of files) {
        const src = read(...parts, f);
        for (const m of src.matchAll(/(?:#\/|openPrint\(`\/)([A-Za-z][A-Za-z0-9-]*)/g)) {
            usedStatic.add(m[1]);
        }
    }
}

console.log(`${c.cyan}▶ Team-app print routes all resolve${c.reset}`);
const unregistered = [...usedStatic].filter(s => !registered.has(s));
// "league" is the league-statistics print — a separate, not-yet-built report;
// tracked as a known gap so it doesn't silently mask a real regression.
const unexpected = unregistered.filter(s => s !== "league");
assert(unexpected.length === 0,
    `no team-app print button targets a missing route (offenders: ${unexpected.join(", ") || "none"})`);
assert(!usedStatic.has("matchplayerlist"), "old 'matchplayerlist' route is gone");
assert(!usedStatic.has("Participating"), "old 'Participating/player' route is gone");
assert(!usedStatic.has("participating-player"), "old 'participating-player' route is gone");
assert(!usedStatic.has("participating-staff"), "old 'participating-staff' route is gone");

// ── Pin the specific fixes ───────────────────────────────────────────────────
console.log(`${c.cyan}▶ Specific fixes${c.reset}`);
{
    const T = ["client", "omkoora-team--main", "components", "Modal"];
    const match = read(...T, "ShowPlayerListModal.tsx");
    assert(/\/match-list\/\$\{dataMatch\?\.id\}/.test(match), "match player list prints via /match-list");

    const players = read(...T, "ShowParticipatingPlayers.tsx");
    assert(/\/team-cards\/\$\{data\}\/all/.test(players), "team players list prints via /team-cards");
    assert(/\/team-cards\/\$\{data\}\/\$\{item\?\.id\}/.test(players), "single player card prints via /team-cards");

    const staff = read(...T, "ShowParticipatingTechnicalStaff.tsx");
    assert(/\/team-staff-cards\/\$\{data\}\/\$\{item\?\.id\}/.test(staff), "single staff card prints via /team-staff-cards");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All team-print-route guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} team-print-route guard(s) failed.${c.reset}`);
    process.exit(1);
}
