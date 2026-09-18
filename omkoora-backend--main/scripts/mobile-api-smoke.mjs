// Automated smoke test for the mobile-app GraphQL fields.
//
// Runs against a live backend (default http://localhost:7001/graphql) and
// asserts that (a) the new types/fields exist in the schema and (b) the
// backend actually returns data (no GraphQL errors, sane shapes).
//
// Usage:
//   /opt/homebrew/opt/node@20/bin/node scripts/mobile-api-smoke.mjs
//   API=https://api.omkooora.com/graphql node scripts/mobile-api-smoke.mjs
//
// Exit code 0 = all passed, 1 = one or more failures.
//
// It seeds one temporary blog row (via the models) so the Blog assertions
// have data to work with, then removes it at the end.

import { Blog } from "../src/Models/index.mjs";

const API = process.env.API || "http://localhost:7001/graphql";

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, extra = "") {
    pass++;
    console.log(`  ✅ ${name}${extra ? "  — " + extra : ""}`);
}
function ko(name, reason) {
    fail++;
    failures.push(`${name}: ${reason}`);
    console.log(`  ❌ ${name}  — ${reason}`);
}

async function gql(query, variables) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
    });
    return res.json();
}

// Assert a query runs with no GraphQL errors, then run an optional checker.
async function test(name, query, checker, variables) {
    try {
        const body = await gql(query, variables);
        if (body.errors) {
            ko(name, "GraphQL error: " + body.errors.map((e) => e.message).join("; "));
            return;
        }
        const extra = checker ? await checker(body.data) : "";
        ok(name, typeof extra === "string" ? extra : "");
    } catch (e) {
        ko(name, "threw: " + (e?.message || e));
    }
}

// Assert a type exposes the given field names (schema introspection).
async function testFields(typeName, expected) {
    const q = `{ __type(name: "${typeName}") { fields { name } } }`;
    await test(`schema: ${typeName} has [${expected.join(", ")}]`, q, (d) => {
        const names = (d.__type?.fields || []).map((f) => f.name);
        const missing = expected.filter((f) => !names.includes(f));
        if (missing.length) throw new Error("missing: " + missing.join(", "));
        return "ok";
    });
}

async function main() {
    console.log(`\n🧪 Mobile API smoke test → ${API}\n`);

    // Seed a temp blog so Blog field assertions have real data.
    let seededId = null;
    try {
        const b = await Blog.create({
            subject: "SMOKE_TEST_BLOG", short_description: "x", description: "y",
            status: "accepted", category: "competitions", author_name: "smoke",
            views_count: 7, createdAt: new Date(Date.now() - 3 * 3600 * 1000),
        });
        seededId = b.id;
    } catch (e) {
        console.log("  (warning) could not seed blog:", e?.message);
    }

    // ---- Schema shape ----------------------------------------------------
    console.log("— Schema —");
    await testFields("Blog", ["category", "category_label", "author_name", "views_count", "time_ago"]);
    await testFields("Match", ["venue", "minute"]);
    await testFields("League", ["status", "status_label", "clubs", "clubs_count", "organizer_name", "best_player"]);
    await testFields("LeagueBestPlayer", ["player", "goals", "team_name"]);
    await testFields("Player", ["transfers_count", "loans_count", "competitions_count"]);

    // ---- Blog data + mutation -------------------------------------------
    console.log("— Blog —");
    await test("allBlogs returns array w/ computed fields", `{
        allBlogs { id category category_label author_name views_count time_ago }
    }`, (d) => {
        if (!Array.isArray(d.allBlogs)) throw new Error("not an array");
        if (seededId) {
            const b = d.allBlogs.find((x) => x.id === seededId);
            if (!b) throw new Error("seeded blog not returned");
            if (b.category_label !== "مسابقات") throw new Error("category_label=" + b.category_label);
            if (!b.time_ago) throw new Error("time_ago empty");
            return `label=${b.category_label} time_ago=${b.time_ago} views=${b.views_count}`;
        }
        return `${d.allBlogs.length} blogs`;
    });

    if (seededId) {
        await test("incrementBlogViews bumps the counter", `mutation ($id: ID!) {
            incrementBlogViews(id: $id) { status }
        }`, async (d) => {
            if (!d.incrementBlogViews?.status) throw new Error("status false");
            const after = await gql(`{ blog(id: "${seededId}") { views_count } }`);
            const v = after.data?.blog?.views_count;
            if (v !== 8) throw new Error("expected 8 after increment, got " + v);
            return "7 → 8";
        }, { id: seededId });
    }

    // ---- Platform totals -------------------------------------------------
    console.log("— Platform stats —");
    await test("FetchAllData.GeneralStat returns platform totals", `{
        FetchAllData { GeneralStat {
            totalTeams totalClubs totalVenues totalMatches totalTransfers
            totalLoans totalEvents totalBookings totalTechnicalStaff
            totalBoardMembers totalAgeCategories Members blogs acceptedPlayer leagues
        } }
    }`, (d) => {
        const g = d.FetchAllData?.GeneralStat;
        if (!g) throw new Error("no GeneralStat");
        const nums = ["totalTeams", "totalClubs", "totalMatches", "totalAgeCategories"];
        for (const k of nums) if (typeof g[k] !== "number") throw new Error(`${k} not a number (${g[k]})`);
        return `teams=${g.totalTeams} clubs=${g.totalClubs} matches=${g.totalMatches} ageCats=${g.totalAgeCategories}`;
    });

    // platformStatistics is a super-admin @auth query; unauthenticated we
    // only assert it is correctly guarded (the authenticated app covers data).
    {
        const name = "platformStatistics is auth-guarded";
        const body = await gql(`{ platformStatistics { players } }`);
        const msg = body.errors?.[0]?.message || "";
        if (/authenticated user/i.test(msg)) ok(name, "guard OK (protected)");
        else if (body.data?.platformStatistics && typeof body.data.platformStatistics.players === "number")
            ok(name, `authenticated: players=${body.data.platformStatistics.players}`);
        else ko(name, "unexpected: " + (msg || JSON.stringify(body.data)));
    }

    // ---- Mobile aggregation queries -------------------------------------
    console.log("— Aggregations —");
    const arrayQueries = [
        ["statsTeamsWithPlayerCount", `{ statsTeamsWithPlayerCount { team { id name } clubName playersCount } }`],
        ["statsPlayersByAgeCategory", `{ statsPlayersByAgeCategory { ageCategory ageLabel playersCount clubsCount teamsCount } }`],
        ["statsTransfersByTeam", `{ statsTransfersByTeam { team { id name } clubName transfersCount loansCount } }`],
        ["allTechnicalStaff", `{ allTechnicalStaff { id } }`],
        ["allBoardMembers", `{ allBoardMembers { id } }`],
        ["allEventsGlobal", `{ allEventsGlobal { id } }`],
        ["allBookings", `{ allBookings { id } }`],
    ];
    for (const [name, q] of arrayQueries) {
        await test(name, q, (d) => {
            if (!Array.isArray(d[name])) throw new Error("not an array");
            return `${d[name].length} rows`;
        });
    }
    await test("globalSearch runs", `{ globalSearch(query: "a") {
        clubs { id } teams { id } players { id } competitions { id }
    } }`, (d) => {
        const r = d.globalSearch;
        if (!r) throw new Error("null");
        for (const k of ["clubs", "teams", "players", "competitions"])
            if (!Array.isArray(r[k])) throw new Error(`${k} not an array`);
        return `clubs=${r.clubs.length} teams=${r.teams.length} players=${r.players.length} comps=${r.competitions.length}`;
    });

    // ---- League computed fields (data-dependent, must not error) --------
    console.log("— Leagues —");
    await test("allLeaguesExternal w/ computed fields", `{
        allLeaguesExternal {
            id name status status_label organizer_name clubs_count
            clubs { id name } best_player { goals team_name player { id } }
        }
    }`, (d) => {
        if (!Array.isArray(d.allLeaguesExternal)) throw new Error("not an array");
        const n = d.allLeaguesExternal.length;
        const withStatus = d.allLeaguesExternal.filter((l) => l.status).length;
        return `${n} leagues, ${withStatus} with status`;
    });

    // ---- Player computed fields -----------------------------------------
    console.log("— Player —");
    const anyPlayer = await gql(`{ allPlayersAcceptedExternal(limit: 1, offset: 0) { id } }`);
    let pid = anyPlayer.data?.allPlayersAcceptedExternal?.[0]?.id;
    if (!pid) {
        // Fall back to any player surfaced by globalSearch.
        const gs = await gql(`{ globalSearch(query: "a") { players { id } } }`);
        pid = gs.data?.globalSearch?.players?.[0]?.id;
    }
    if (pid) {
        await test("player computed counts", `{
            player(id: "${pid}") { id transfers_count loans_count competitions_count }
        }`, (d) => {
            const p = d.player;
            if (!p) throw new Error("null");
            for (const k of ["transfers_count", "loans_count", "competitions_count"])
                if (typeof p[k] !== "number") throw new Error(`${k} not a number (${p[k]})`);
            return `transfers=${p.transfers_count} loans=${p.loans_count} comps=${p.competitions_count}`;
        });
    } else {
        console.log("  (skipped) no accepted player in DB to test computed counts");
    }

    // Cleanup seeded blog.
    if (seededId) {
        try { await Blog.destroy({ where: { id: seededId }, force: true }); }
        catch (e) { console.log("  (warning) could not remove seeded blog:", e?.message); }
    }

    console.log(`\n${fail === 0 ? "✅" : "❌"} Done: ${pass} passed, ${fail} failed.`);
    if (fail) { console.log("Failures:\n - " + failures.join("\n - ")); }
    process.exit(fail === 0 ? 0 : 1);
}

main();
