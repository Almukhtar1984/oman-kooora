#!/usr/bin/env node
/**
 * Guards for the club's "عضوية الفريق" modal (members page → العضوية tab).
 *
 * It used to come back empty for most teams — club-side membership records
 * (manual add, sheet import, bulk add) carry only id_club, and the query
 * filtered on id_team — and its table rendered misaligned because the grid
 * declared 10 column widths for 11 columns.
 *
 *   node tests/test-assembly-team-modal.mjs
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

console.log(`${c.cyan}▶ allAssemblyTeam resolver${c.reset}`);
{
    const schema = read("omkoora-backend--main", "src", "Graphql", "Schemas", "Assembly.mjs");
    assert(/allAssemblyTeam\(idTeam: ID, withClubMembers: Boolean\)/.test(schema), "query accepts withClubMembers");

    const resolver = read("omkoora-backend--main", "src", "Graphql", "Resolvers", "Assembly.mjs");
    const start = resolver.indexOf("allAssemblyTeam: async");
    const body = resolver.slice(start, resolver.indexOf("Assembly: {", start));
    assert(start !== -1, "resolver exists");
    assert(/if \(!idTeam\) return \[\]/.test(body), "no team → empty list (never every team-less record)");
    assert(/order/.test(body) && /\["first_name", "ASC"\]/.test(body), "results are ordered by name");
    assert(/Players\.findAll/.test(body) && /TechnicalApparatus\.findAll/.test(body) && /Members\.findAll/.test(body),
        "collects the team's players, staff and members");
    assert(/id_club: team\.id_club, card_number: \{ \[Op\.in\]: cards \}/.test(body),
        "matches club records by the team's civil IDs");
    assert(/seen\.has\(key\)/.test(body), "drops duplicate records of the same person");
}

console.log(`${c.cyan}▶ Club modal + print use the club-wide match${c.reset}`);
{
    for (const app of [["client", "omkoora-club--main", "graphql"], ["client", "print", "src", "graphql"]]) {
        const q = read(...app, "queries", "assembly", "AllAssemblyTeam.tsx");
        assert(/withClubMembers: \$withClubMembers/.test(q), `${app[1]} query forwards withClubMembers`);
    }
    const clubQ = read("client", "omkoora-club--main", "graphql", "queries", "assembly", "AllAssemblyTeam.tsx");
    assert(/nationalIDBack/.test(clubQ), "club query fetches nationalIDBack (back-of-card column)");
    const modal = read("client", "omkoora-club--main", "components", "Modal", "ShowAssemblyTeamModal.tsx");
    assert(/withClubMembers: true/.test(modal), "club modal requests club members");
    assert(/variables\?\.idTeam === team/.test(modal), "modal only shows the selected team's result");
    const print = read("client", "print", "src", "Assembly.tsx");
    assert(/withClubMembers: true/.test(print), "printed team list matches the modal");

    // The team app manages its own records — it must keep the id_team-only list.
    const teamQ = read("client", "omkoora-team--main", "graphql", "queries", "assembly", "AllAssembly.tsx");
    assert(!/withClubMembers/.test(teamQ), "team app query unchanged");
}

console.log(`${c.cyan}▶ Team table renders aligned rows${c.reset}`);
{
    const table = read("client", "omkoora-club--main", "components", "Tables", "AssemblyTableTeam.tsx");
    assert(!/grid-template-columns/.test(table), "no hand-counted grid template");
    assert(/<colgroup>/.test(table) && /<tbody>/.test(table), "native table: one cell per column per row");
    assert(/setPage\(1\)/.test(table), "pagination resets when the list changes");
}

if (failures) { console.log(`\n${c.red}${failures} failure(s)${c.reset}`); process.exit(1); }
console.log(`\n${c.green}all good${c.reset}`);
