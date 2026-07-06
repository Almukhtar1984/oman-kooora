#!/usr/bin/env node
/**
 * Guards for "سادساً: التقارير والطباعة" — the printable per-match player list
 * showing each player's أساسي / احتياط status.
 *
 * Behavioural unit tests of the pure lineup helper (name-building + ordering,
 * no DB) plus static guards that the public query, resolver, print route and
 * the sports-course print button are all wired.
 *
 *   node tests/test-match-lineup.mjs
 */

import { fullName, toLineupPlayer, sortLineup, buildLineup } from "../src/Helpers/MatchLineup.mjs";
import { readFileSync } from "fs";
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

console.log(`${c.cyan}▶ Name building${c.reset}`);
{
    assert(fullName({ first_name: "أحمد", second_name: "بن", third_name: "علي", tribe: "الكندي" }) === "أحمد بن علي الكندي",
        "joins the four name parts");
    assert(fullName({ first_name: "أحمد", tribe: "الكندي" }) === "أحمد الكندي",
        "skips missing parts (no 'undefined')");
    assert(fullName(undefined) === "", "empty person -> empty string");
}

console.log(`${c.cyan}▶ Row -> print player${c.reset}`);
{
    const p = toLineupPlayer({ starter: true, sub: false, number: 10, player_center: "مهاجم", person: { first_name: "أحمد" } });
    assert(p.name === "أحمد" && p.number === "10" && p.position === "مهاجم", "maps name / number / position");
    assert(p.starter === true && p.sub === false, "carries the أساسي / احتياط flags");
    assert(toLineupPlayer({}).number === "", "missing number becomes empty string, not 'undefined'");
}

console.log(`${c.cyan}▶ Ordering: starters first, then by number${c.reset}`);
{
    const rows = [
        { starter: false, sub: true,  number: 3,  person: { first_name: "sub3" } },
        { starter: true,  sub: false, number: 9,  person: { first_name: "start9" } },
        { starter: true,  sub: false, number: 1,  person: { first_name: "start1" } },
        { starter: false, sub: true,  number: 12, person: { first_name: "sub12" } },
    ];
    const out = buildLineup(rows).map(p => p.name);
    assert(JSON.stringify(out) === JSON.stringify(["start1", "start9", "sub3", "sub12"]),
        "starters (by number) come before substitutes (by number)");
}

console.log(`${c.cyan}▶ Players without a number sink to the bottom of their group${c.reset}`);
{
    const rows = [
        { starter: true, number: "",  person: { first_name: "noNum" } },
        { starter: true, number: 5,   person: { first_name: "five" } },
    ];
    assert(JSON.stringify(buildLineup(rows).map(p => p.name)) === JSON.stringify(["five", "noNum"]),
        "numbered starter precedes the un-numbered one");
    assert(sortLineup([]).length === 0, "empty input is safe");
}

// ── Static guards: backend query + resolver ──────────────────────────────────
console.log(`${c.cyan}▶ Backend exposes a public match lineup${c.reset}`);
{
    const schema = read("omkoora-backend--main", "src", "Graphql", "Schemas", "League.mjs");
    assert(/matchLineup\(id: ID!\): MatchLineup(?!\s*@auth)/.test(schema) || /matchLineup\(id: ID!\): MatchLineup\s*\n/.test(schema),
        "matchLineup query exists and is public (no @auth)");
    assert(/type MatchLineup \{[\s\S]*firstTeamPlayers: \[MatchLineupPlayer\][\s\S]*secondTeamPlayers: \[MatchLineupPlayer\]/.test(schema),
        "MatchLineup returns both teams' players");
    assert(/type MatchLineupPlayer \{[\s\S]*starter: Boolean[\s\S]*sub: Boolean/.test(schema),
        "MatchLineupPlayer carries starter + sub");

    const resolver = read("omkoora-backend--main", "src", "Graphql", "Resolvers", "League.mjs");
    assert(/import \{ buildLineup \}/.test(resolver), "resolver imports the pure helper");
    assert(/matchLineup: async/.test(resolver), "matchLineup resolver exists");
    assert(/firstTeamPlayers: await lineupFor\(match\.first_team\)/.test(resolver), "builds the first team lineup");
    assert(/secondTeamPlayers: await lineupFor\(match\.second_team\)/.test(resolver), "builds the second team lineup");
}

// ── Static guards: print app route + component ───────────────────────────────
console.log(`${c.cyan}▶ Print app renders the report${c.reset}`);
{
    const index = read("client", "print", "src", "index.tsx");
    assert(/path="\/match-list\/:id"/.test(index), "print app has a /match-list/:id route");
    assert(/MatchLineupPrint/.test(index), "route renders MatchLineupPrint");

    const q = read("client", "print", "src", "graphql", "queries", "leagues", "MatchLineup.tsx");
    assert(/matchLineup\(id: \$id\)/.test(q) && /starter/.test(q) && /sub/.test(q),
        "print query fetches the lineup with status");
}

// ── Static guards: sports-course print button ────────────────────────────────
console.log(`${c.cyan}▶ Organiser can trigger the print${c.reset}`);
{
    const show = read("client", "sports-course", "src", "components", "Modals", "ShowMatch.tsx");
    assert(/\/#\/match-list\/\$\{item\?\.id\}/.test(show), "ShowMatch links to the print route");
    assert(/طباعة كشف اللاعبين/.test(show), "the menu item is labelled for printing the player list");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All match-lineup guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} match-lineup guard(s) failed.${c.reset}`);
    process.exit(1);
}
