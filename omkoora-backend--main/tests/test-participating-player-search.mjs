#!/usr/bin/env node
/**
 * Static guard for the advanced player search when adding players to a league
 * team (team app → المسابقات → إضافة اللاعبين). Locks in the promised UX:
 *
 *   1. A searchable picker that matches by NAME or NATIONAL ID (card_number),
 *      without ever printing the national id in the dropdown label.
 *   2. Age range (from/to) and birth-date range narrowing above the list.
 *   3. Everything is client-side / real-time — the available list is derived
 *      with useMemo from the already-loaded players, not a new query per ke/filter.
 *
 * Pure text checks: no DB, no network. Run with:
 *   node tests/test-participating-player-search.mjs
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m" };
const ok  = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);

let failures = 0;
const assert = (cond, msg) => {
    if (cond) ok(msg);
    else { bad(msg); failures++; }
};

const root = resolve(__dirname, "..", "..");
const read = (...parts) => {
    try { return readFileSync(resolve(root, ...parts), "utf8"); }
    catch { return ""; }
};

const TEAM = "client/omkoora-team--main";
const MODAL = ["components", "Modal", "AddParticipatingPlayers.tsx"];

console.log(`${c.cyan}▶ Data source has the fields search/filter need${c.reset}`);
{
    const q = read(TEAM, "graphql", "queries", "players", "AllPlayers.tsx");
    assert(q !== "", "AllPlayers query exists");
    assert(/card_number/.test(q), "query fetches person.card_number (search by national id)");
    assert(/date_birth/.test(q), "query fetches person.date_birth (age / birth-date filter)");
}

console.log(`${c.cyan}▶ Add-players modal${c.reset}`);
const src = read(TEAM, ...MODAL);
assert(src !== "", "AddParticipatingPlayers.tsx exists");

console.log(`${c.cyan}▶ Search by name OR national id (id kept hidden)${c.reset}`);
{
    // The picker is searchable with a custom filter.
    assert(/searchable/.test(src), "player picker is searchable");
    assert(/filter=\{/.test(src), "player picker uses a custom filter");
    // Filter must consider BOTH the label (name) and card_number (national id).
    const filterBlock = src.slice(src.indexOf("filter={"), src.indexOf("filter={") + 400);
    assert(/item\.label|\.label/.test(filterBlock), "filter matches on the name label");
    assert(/card_number/.test(filterBlock), "filter also matches on card_number (national id)");

    // The visible label must be built from the name/type only — NOT the id.
    const labelLine = (src.match(/label:\s*`[^`]*`/) || [""])[0];
    assert(labelLine !== "", "builds a display label");
    assert(!/card_number/.test(labelLine), "national id is NOT shown in the dropdown label");
    assert(/card_number:\s*item\?\.person\?\.card_number/.test(src), "card_number kept as a separate hidden field");
}

console.log(`${c.cyan}▶ Age range + birth-date narrowing${c.reset}`);
{
    assert(/ageFrom/.test(src) && /ageTo/.test(src), "has age from/to controls");
    assert(/birthFrom/.test(src) && /birthTo/.test(src), "has birth-date from/to controls");
    assert(/computeAge/.test(src) && /diff\(.*["']year["']\)/.test(src), "derives age from date_birth");
    // The narrowing must actually gate the available list.
    const memo = src.slice(src.indexOf("availableToAdd"), src.indexOf("availableToAdd") + 700);
    assert(/ageFrom/.test(memo) && /ageTo/.test(memo), "age range filters the available list");
    assert(/birthFrom/.test(memo) && /birthTo/.test(memo), "birth-date range filters the available list");
}

console.log(`${c.cyan}▶ Real-time, no refetch${c.reset}`);
{
    assert(/useMemo/.test(src), "uses useMemo for derived lists");
    assert(/const availableToAdd = useMemo\(/.test(src), "available list is a client-side memo (no query per keystroke)");
    // Already-picked players drop out of the list live.
    const memo = src.slice(src.indexOf("availableToAdd"), src.indexOf("availableToAdd") + 700);
    assert(/values\.players/.test(memo) && /picked/.test(memo), "already-selected players are excluded live");
}

console.log(`${c.cyan}▶ Existing submit contract preserved${c.reset}`);
{
    assert(/id_player:\s*player\.id_player/.test(src), "submit still sends id_player");
    assert(/id_participating_team:\s*player\.id_participating_team/.test(src), "submit still sends id_participating_team");
    assert(/number:\s*player\?\.number/.test(src), "submit still sends the jersey number");
    assert(/externalCount\s*>\s*parseInt\(LegalExternalPlayer\)/.test(src), "external-player limit still enforced");
    assert(/رقم القميص مكرر/.test(src), "duplicate jersey-number validation preserved");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All participating-player-search guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} guard(s) failed.${c.reset}`);
    process.exit(1);
}
