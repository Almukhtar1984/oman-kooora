#!/usr/bin/env node
/**
 * Guards for the printable team roster (players + technical staff) — the
 * organiser selects a team and prints one list of player names and technical
 * staff names.
 *
 * Static guards over the public query, resolver, print route/component, and the
 * sports-course print button. (The name-building is the same fullName helper
 * already unit-tested in test-match-lineup.)
 *
 *   node tests/test-team-roster.mjs
 */

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

console.log(`${c.cyan}▶ Backend exposes a public team roster${c.reset}`);
{
    const schema = read("omkoora-backend--main", "src", "Graphql", "Schemas", "League.mjs");
    assert(/teamRoster\(id: ID!\): TeamRoster/.test(schema), "teamRoster query exists");
    assert(!/teamRoster\(id: ID!\): TeamRoster\s*@auth/.test(schema), "teamRoster is public (no @auth)");
    assert(/type TeamRoster \{[\s\S]*players: \[RosterPlayer\][\s\S]*staff: \[RosterStaff\]/.test(schema),
        "TeamRoster returns players AND staff");
    assert(/type RosterPlayer \{[\s\S]*number: String[\s\S]*name: String[\s\S]*position: String/.test(schema),
        "RosterPlayer has number / name / position");
    assert(/type RosterStaff \{[\s\S]*name: String[\s\S]*job: String/.test(schema), "RosterStaff has name / job");

    const resolver = read("omkoora-backend--main", "src", "Graphql", "Resolvers", "League.mjs");
    assert(/teamRoster: async/.test(resolver), "teamRoster resolver exists");
    const start = resolver.indexOf("teamRoster: async");
    const body = resolver.slice(start, start + 4400);
    assert(/ParticipatingPlayers\.findAll/.test(body), "loads the team's players");
    assert(/ParticipatingTechnicalStaff\.findAll/.test(body), "loads the team's technical staff");
    assert(/TechnicalApparatus\.findAll/.test(body), "resolves staff occupation");
    assert(/fullName\(person\)/.test(body), "builds names via the shared helper");
    assert(/Person\.findAll/.test(body), "bulk-loads person names (no per-row lookup)");
    // Duplicate participating-player rows must not repeat in the printed roster.
    assert(/uniqueBy/.test(body) && /uniquePpRows/.test(body), "dedups repeated player rows by id_player");
    assert(/uniquePtsRows/.test(body), "dedups repeated staff rows");
    assert(/uniquePpRows[\s\S]*\.map\(r =>/.test(body), "roster players are built from the deduped rows");
}

console.log(`${c.cyan}▶ createParticipatingPlayers blocks duplicate enrolments${c.reset}`);
{
    const resolver = read("omkoora-backend--main", "src", "Graphql", "Resolvers", "League.mjs");
    const start = resolver.indexOf("createParticipatingPlayers: async");
    const body = resolver.slice(start, start + 1600);
    assert(/ParticipatingPlayers\.findAll/.test(body), "checks who is already enrolled before inserting");
    assert(/id_participating_team.*::.*id_player|\$\{r\.id_participating_team\}::\$\{r\.id_player\}/.test(body),
        "keys the dedup on (team, player)");
    assert(/freshRows/.test(body) && /bulkCreate\(freshRows\)/.test(body), "only inserts non-duplicate rows");
}

console.log(`${c.cyan}▶ Print app renders the roster${c.reset}`);
{
    const index = read("client", "print", "src", "index.tsx");
    assert(/path="\/team-roster\/:id"/.test(index), "print app has a /team-roster/:id route");
    assert(/TeamRosterPrint/.test(index), "route renders TeamRosterPrint");

    const q = read("client", "print", "src", "graphql", "queries", "leagues", "TeamRoster.tsx");
    assert(/teamRoster\(id: \$id\)/.test(q) && /players/.test(q) && /staff/.test(q),
        "print query fetches players + staff");

    const comp = read("client", "print", "src", "components", "PDF", "TeamRosterList.tsx");
    assert(/اللاعبون/.test(comp) && /الجهاز الفني/.test(comp), "component has both sections");
}

console.log(`${c.cyan}▶ Organiser prints per selected team${c.reset}`);
{
    const show = read("client", "sports-course", "src", "components", "Modals", "ShowParticipatingPlayers.tsx");
    assert(/\/#\/team-roster\/\$\{data\}/.test(show), "ShowParticipatingPlayers links to the roster print for the selected team");
    assert(/طباعة كشف الفريق/.test(show), "the button prints the team roster (players + staff)");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All team-roster guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} team-roster guard(s) failed.${c.reset}`);
    process.exit(1);
}
