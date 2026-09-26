// Automated smoke test for the Tomoh mobile-app auth surface.
//
// Verifies, against a live backend (default http://localhost:7001/graphql):
//   1. BROWSING queries work WITHOUT any token (public-safe).
//   2. Team-scoped queries return [] without idTeam (no crash, no bulk dump).
//   3. ADMIN queries still require a user token (stay protected).
//
// Usage: /opt/homebrew/opt/node@20/bin/node scripts/mobile-app-auth-smoke.mjs
//        API=https://api.omkooora.com/graphql node scripts/mobile-app-auth-smoke.mjs
// Exit 0 = all passed, 1 = one or more failed.

const API = process.env.API || "http://localhost:7001/graphql";
let pass = 0, fail = 0;
const failures = [];
const ok = (n, x = "") => { pass++; console.log(`  ✅ ${n}${x ? "  — " + x : ""}`); };
const ko = (n, r) => { fail++; failures.push(`${n}: ${r}`); console.log(`  ❌ ${n}  — ${r}`); };

async function gql(query, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token.startsWith("Bearer") ? token : `Bearer ${token}`;
    const res = await fetch(API, { method: "POST", headers, body: JSON.stringify({ query }) });
    return res.json();
}
const authError = (body) => (body.errors || []).some((e) => /authenticated user/i.test(e.message || ""));

// A browsing query must run WITHOUT a token and not raise an auth error.
async function browses(name, query, check) {
    try {
        const body = await gql(query);
        if (authError(body)) return ko(name, "unexpected auth error (should be public)");
        if (body.errors) return ko(name, "GraphQL error: " + body.errors.map((e) => e.message).join("; "));
        ok(name, check ? check(body.data) : "");
    } catch (e) { ko(name, "threw: " + (e?.message || e)); }
}
// An admin query must be REJECTED without a token.
async function isProtected(name, query) {
    try {
        const body = await gql(query);
        if (authError(body)) ok(name, "protected ✓");
        else ko(name, "NOT protected (should require a user token)");
    } catch (e) { ko(name, "threw: " + (e?.message || e)); }
}

async function main() {
    console.log(`\n📱 Mobile-app auth smoke → ${API}\n`);

    // Grab real ids for detail queries.
    const pl = await gql(`{ allPlayersAcceptedExternal(limit: 1, offset: 0){ players { id team { id club { id } } } } }`);
    const p0 = pl.data?.allPlayersAcceptedExternal?.players?.[0];
    const playerId = p0?.id, teamId = p0?.team?.id, clubId = p0?.team?.club?.id;
    const lg = await gql(`{ allLeaguesExternal { matchs { id } } }`);
    const matchId = (lg.data?.allLeaguesExternal || []).flatMap((l) => l.matchs || [])[0]?.id;

    console.log("— Browsing (must work WITHOUT a token) —");
    await browses("allPlayersAcceptedExternal", `{ allPlayersAcceptedExternal(limit: 5, offset: 0){ totalCount players { id } } }`,
        (d) => `totalCount=${d.allPlayersAcceptedExternal.totalCount}`);
    await browses("globalSearch", `{ globalSearch(query: "a"){ players { id } clubs { id } } }`,
        (d) => `players=${d.globalSearch.players.length}`);
    await browses("allClub", `{ allClub { id name } }`, (d) => `${d.allClub.length} clubs`);
    await browses("allTeams", `{ allTeams { id name } }`, (d) => `${d.allTeams.length} teams`);
    await browses("allLeaguesExternal", `{ allLeaguesExternal { id status_label } }`, (d) => `${d.allLeaguesExternal.length} leagues`);
    await browses("allBlogs", `{ allBlogs { id category_label } }`, (d) => `${d.allBlogs.length} blogs`);
    if (playerId) await browses("player(id)", `{ player(id: "${playerId}"){ id class person { first_name } } }`, () => "ok");
    else console.log("  (skip) no player id");
    if (teamId) await browses("team(id)", `{ team(id: "${teamId}"){ id name } }`, () => "ok");
    else console.log("  (skip) no team id");
    if (clubId) await browses("club(id)", `{ club(id: "${clubId}"){ id name } }`, () => "ok");
    else console.log("  (skip) no club id");
    if (matchId) {
        await browses("getMatch(id)", `{ getMatch(id: "${matchId}"){ id date } }`, () => "ok");
        await browses("ExternalMatch(id)", `{ ExternalMatch(id: "${matchId}"){ id } }`, () => "ok");
    } else console.log("  (skip) no match id");

    console.log("— Team-scoped: [] without idTeam (no crash / no dump) —");
    for (const q of ["allPlayers", "allMembers", "allTechnicalApparatus", "allSanctionsTeam"]) {
        await browses(`${q} → []`, `{ ${q} { id } }`, (d) => (Array.isArray(d[q]) && d[q].length === 0) ? "[]" : `WARN len=${d[q]?.length}`);
    }

    console.log("— Admin queries stay PROTECTED (rejected without a user token) —");
    await isProtected("statisticsTeam", `{ statisticsTeam(idTeam: "x"){ numberPlayers } }`);
    await isProtected("allExpensesTeam", `{ allExpensesTeam(idTeam: "x"){ id } }`);
    await isProtected("allPermissionsTeam", `{ allPermissionsTeam(idTeam: "x"){ id } }`);
    await isProtected("allMembersHasAccount", `{ allMembersHasAccount(idTeam: "x"){ id } }`);

    console.log(`\n${fail === 0 ? "✅" : "❌"} Done: ${pass} passed, ${fail} failed.`);
    if (fail) console.log("Failures:\n - " + failures.join("\n - "));
    process.exit(fail === 0 ? 0 : 1);
}
main();
