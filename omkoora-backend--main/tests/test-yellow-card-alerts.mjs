#!/usr/bin/env node
/**
 * Guards for "خامساً: البطاقات الصفراء" — alert the organiser when a player is
 * booked (yellow) in two CONSECUTIVE fixtures of their team.
 *
 * Behavioural unit tests of the pure detector (computeYellowCardAlerts, no DB)
 * plus static guards that the resolver + sports-course UI expose the required
 * fields: player name, the two matches, and the yellow count.
 *
 *   node tests/test-yellow-card-alerts.mjs
 */

import { computeYellowCardAlerts, buildFixturesByTeam } from "../src/Helpers/YellowCards.mjs";
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

// Team A plays three fixtures on ascending dates. B/C/D are opponents.
const A = "pt-A";
const matches = [
    { id: "m1", date: "2026-01-01", first_team: A, second_team: "pt-B", createdAt: 1 },
    { id: "m2", date: "2026-01-08", first_team: "pt-C", second_team: A, createdAt: 2 },
    { id: "m3", date: "2026-01-15", first_team: A, second_team: "pt-D", createdAt: 3 },
];
const yellow = (id_match, id_player) => ({ id_match, id_player, player: id_player, id_team: A });

console.log(`${c.cyan}▶ Consecutive detection${c.reset}`);
{
    // P1 booked in m1 + m2 (adjacent) -> alert.
    const alerts = computeYellowCardAlerts(matches, [yellow("m1", "P1"), yellow("m2", "P1")]);
    assert(alerts.length === 1, "two yellows in consecutive fixtures produces one alert");
    assert(alerts[0].player === "P1", "alert carries the player");
    assert(alerts[0].yellowCount === 2, "alert reports the yellow count");
    assert(JSON.stringify(alerts[0].matchIds) === JSON.stringify(["m1", "m2"]),
        "alert names the two matches in fixture order");
}

console.log(`${c.cyan}▶ Non-consecutive is NOT alerted${c.reset}`);
{
    // P2 booked in m1 + m3 (a fixture apart) -> no alert.
    const alerts = computeYellowCardAlerts(matches, [yellow("m1", "P2"), yellow("m3", "P2")]);
    assert(alerts.length === 0, "yellows one fixture apart do not alert");
}

console.log(`${c.cyan}▶ A single yellow is NOT alerted${c.reset}`);
{
    const alerts = computeYellowCardAlerts(matches, [yellow("m2", "P3")]);
    assert(alerts.length === 0, "a lone yellow does not alert");
}

console.log(`${c.cyan}▶ Three yellows, two adjacent${c.reset}`);
{
    // P4 in m1,m2,m3 -> adjacent pair m1/m2, count reflects all three.
    const alerts = computeYellowCardAlerts(matches, [yellow("m1", "P4"), yellow("m2", "P4"), yellow("m3", "P4")]);
    assert(alerts.length === 1, "still one alert when three are booked");
    assert(alerts[0].yellowCount === 3, "yellow count is the player's total (3)");
    assert(alerts[0].matchIds[0] === "m1" && alerts[0].matchIds[1] === "m2",
        "reports the first adjacent pair");
}

console.log(`${c.cyan}▶ Order is by date, not input order${c.reset}`);
{
    // Same two bookings, but matches handed in shuffled order.
    const shuffled = [matches[2], matches[0], matches[1]];
    const alerts = computeYellowCardAlerts(shuffled, [yellow("m2", "P1"), yellow("m1", "P1")]);
    assert(alerts.length === 1, "detects adjacency regardless of input order");
    assert(JSON.stringify(alerts[0].matchIds) === JSON.stringify(["m1", "m2"]),
        "orders the pair chronologically");
}

console.log(`${c.cyan}▶ Two cards in the SAME match is NOT two matches${c.reset}`);
{
    const alerts = computeYellowCardAlerts(matches, [yellow("m1", "P5"), yellow("m1", "P5")]);
    assert(alerts.length === 0, "two bookings in one match do not count as consecutive matches");
}

console.log(`${c.cyan}▶ buildFixturesByTeam orders each team's fixtures${c.reset}`);
{
    const byTeam = buildFixturesByTeam([matches[2], matches[0], matches[1]]);
    const ids = (byTeam.get(A) || []).map(m => m.id);
    assert(JSON.stringify(ids) === JSON.stringify(["m1", "m2", "m3"]), "team A fixtures are date-ordered");
}

// ── Static guards: resolver wires the helper + batches, schema exposes fields ─
console.log(`${c.cyan}▶ Resolver uses the pure helper + bulk hydration${c.reset}`);
{
    const league = read("omkoora-backend--main", "src", "Graphql", "Resolvers", "League.mjs");
    assert(/import \{ computeYellowCardAlerts \}/.test(league), "resolver imports the pure helper");
    const start = league.indexOf("yellowCardAlerts:");
    const body = league.slice(start, start + 2600);
    assert(/computeYellowCardAlerts\(/.test(body), "resolver delegates detection to the helper");
    assert(/ParticipatingPlayers\.findAll\(/.test(body), "resolver batches the number lookup");
    assert(!/ParticipatingTeams\.findByPk\(rec\.ptId\)/.test(body), "no per-alert team lookup remains (N+1 removed)");
}

console.log(`${c.cyan}▶ Schema exposes player / matches / count${c.reset}`);
{
    const schema = read("omkoora-backend--main", "src", "Graphql", "Schemas", "League.mjs");
    assert(/type YellowCardAlert \{[\s\S]*player: String[\s\S]*yellowCount: Int[\s\S]*matches: \[YellowCardMatch\]/.test(schema),
        "YellowCardAlert has player, yellowCount and matches");
    assert(/type YellowCardMatch \{[\s\S]*firstTeam: String[\s\S]*secondTeam: String/.test(schema),
        "YellowCardMatch names both teams");
}

console.log(`${c.cyan}▶ Organiser UI shows the required details${c.reset}`);
{
    const q = read("client", "sports-course", "src", "graphql", "queries", "leagues", "YellowCardAlerts.tsx");
    assert(/player/.test(q) && /yellowCount/.test(q) && /matches[\s\S]*firstTeam[\s\S]*secondTeam/.test(q),
        "query fetches player, count and both match teams");
    const ui = read("client", "sports-course", "src", "components", "Modals", "LeagueStats.tsx");
    assert(/a\.player/.test(ui), "UI renders the player name");
    assert(/a\.yellowCount/.test(ui), "UI renders the yellow count");
    assert(/a\.matches/.test(ui) && /firstTeam/.test(ui) && /secondTeam/.test(ui), "UI renders the two matches");
    assert(/متتاليتين|مباراتين/.test(ui), "UI labels it as consecutive matches");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All yellow-card-alert guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} yellow-card-alert guard(s) failed.${c.reset}`);
    process.exit(1);
}
