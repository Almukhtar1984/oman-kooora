#!/usr/bin/env node
/**
 * Smoke test for the bulk changeStatus mutations:
 *   - changeStatusMembersBulk
 *   - changeStatusPlayersBulk
 *   - changeStatusTechnicalApparatusBulk
 *
 *   API=http://localhost:7000 \
 *   CLUB_ORIGIN=http://localhost:3001 \
 *   CLUB_EMAIL='clubadmin@example.com' \
 *   CLUB_PASSWORD='...' \
 *   node tests/test-bulk-change-status.mjs
 *
 * Phase A (always runs, no side effects) — calls each bulk mutation with
 * an empty ids list and verifies the resolver returns
 * `{success: 0, total: 0}`. Confirms the mutation is wired and the result
 * type shape is correct.
 *
 * Phase B (only with WRITE=1) — for each entity type, picks one real row
 * from the club, captures its original status/note, calls the bulk
 * mutation to flip it, verifies the flip, then restores the original
 * status via the same bulk mutation. If the club has no rows for an
 * entity type, that phase is skipped (not a failure).
 *
 * Default is read-only (DRY_RUN behaviour) — pass WRITE=1 to opt in.
 */

const API           = (process.env.API           || "http://localhost:7000").replace(/\/$/, "");
const CLUB_ORIGIN   =  process.env.CLUB_ORIGIN   || "http://localhost:3001";
const CLUB_EMAIL    =  process.env.CLUB_EMAIL    || "clubadmin@example.com";
const CLUB_PASSWORD =  process.env.CLUB_PASSWORD || "change-me";
const ID_CLUB_OVR   =  process.env.ID_CLUB       || null;
const WRITE         =  process.env.WRITE === "1";

const c = {reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m"};
const log  = (m) => console.log(m);
const ok   = (m) => log(`${c.green}✓${c.reset} ${m}`);
const bad  = (m) => log(`${c.red}✗${c.reset} ${m}`);
const info = (m) => log(`${c.cyan}ℹ${c.reset} ${c.dim}${m}${c.reset}`);

let failures = 0;
function check(cond, msg) {
    if (cond) ok(msg);
    else { bad(msg); failures++; }
}

async function gql({origin, token, query, variables}) {
    const res = await fetch(`${API}/graphql`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            ...(origin ? {origin} : {}),
            ...(token ? {authorization: token} : {}),
        },
        body: JSON.stringify({query, variables}),
    });
    const json = await res.json().catch(() => ({errors: [{message: "invalid JSON response"}]}));
    if (json.errors) {
        const err = new Error(json.errors[0]?.message || "GraphQL error");
        err.code = json.errors[0]?.extensions?.code;
        err.payload = json;
        throw err;
    }
    return json.data;
}

const Q_LOGIN = `
    mutation($content: loginInfo) {
        authenticateUser(content: $content) { token user { id email role } }
    }`;

const Q_CURRENT_USER = `
    query {
        currentUser {
            id email role
            person { id member { id team { id name club { id name } } } }
        }
    }`;

const Q_ALL_MEMBERS_CLUB = `
    query($idClub: ID) {
        allMembersClub(idClub: $idClub) { id status note }
    }`;

const Q_ALL_PLAYERS_CLUB = `
    query($idClub: ID) {
        allPlayersClub(idClub: $idClub) { id status note }
    }`;

const Q_ALL_TECH_CLUB = `
    query($idClub: ID) {
        allTechnicalApparatusClub(idClub: $idClub) { id status note }
    }`;

const M_BULK_MEMBERS = `
    mutation($ids: [ID!]!, $status: String!, $note: String) {
        changeStatusMembersBulk(ids: $ids, status: $status, note: $note) { success total }
    }`;

const M_BULK_PLAYERS = `
    mutation($ids: [ID!]!, $status: String!, $note: String) {
        changeStatusPlayersBulk(ids: $ids, status: $status, note: $note) { success total }
    }`;

const M_BULK_TECH = `
    mutation($ids: [ID!]!, $status: String!, $note: String) {
        changeStatusTechnicalApparatusBulk(ids: $ids, status: $status, note: $note) { success total }
    }`;

const SCENARIOS = [
    {label: "Members",  listQ: Q_ALL_MEMBERS_CLUB, listKey: "allMembersClub",            mut: M_BULK_MEMBERS, resultKey: "changeStatusMembersBulk"},
    {label: "Players",  listQ: Q_ALL_PLAYERS_CLUB, listKey: "allPlayersClub",            mut: M_BULK_PLAYERS, resultKey: "changeStatusPlayersBulk"},
    {label: "Tech",     listQ: Q_ALL_TECH_CLUB,    listKey: "allTechnicalApparatusClub", mut: M_BULK_TECH,    resultKey: "changeStatusTechnicalApparatusBulk"},
];

async function phaseEmpty(token) {
    log(`\n${c.yellow}━━ Phase A: empty-ids (no DB writes) ━━${c.reset}`);
    for (const s of SCENARIOS) {
        try {
            const data = await gql({
                origin: CLUB_ORIGIN, token,
                query: s.mut,
                variables: {ids: [], status: "accepted"},
            });
            const r = data?.[s.resultKey];
            check(!!r,                                 `${s.label}: mutation responded with a payload`);
            check(r?.success === 0 && r?.total === 0,  `${s.label}: empty input → {success:0,total:0} (got {success:${r?.success},total:${r?.total}})`);
        } catch (e) {
            check(false, `${s.label}: empty-call threw → ${e.message}`);
        }
    }
}

async function phaseRoundTrip(token, idClub) {
    log(`\n${c.yellow}━━ Phase B: round-trip on 1 real row per type (WRITE=1) ━━${c.reset}`);
    for (const s of SCENARIOS) {
        try {
            const data = await gql({origin: CLUB_ORIGIN, token, query: s.listQ, variables: {idClub}});
            const rows = data?.[s.listKey] || [];
            if (rows.length === 0) {
                info(`${s.label}: no rows in this club, skipping round-trip`);
                continue;
            }
            const target = rows[0];
            const originalStatus = target.status;
            const originalNote   = target.note;
            const flipStatus     = originalStatus === "waiting" ? "waiting_club" : "waiting";

            // Flip
            const flip = await gql({
                origin: CLUB_ORIGIN, token,
                query: s.mut,
                variables: {ids: [target.id], status: flipStatus, note: "smoke-test"},
            });
            check(flip?.[s.resultKey]?.success === 1, `${s.label}: bulk flip applied (success=${flip?.[s.resultKey]?.success})`);
            check(flip?.[s.resultKey]?.total === 1,   `${s.label}: total mirrors input length (total=${flip?.[s.resultKey]?.total})`);

            // Re-read to confirm
            const after = await gql({origin: CLUB_ORIGIN, token, query: s.listQ, variables: {idClub}});
            const updated = (after?.[s.listKey] || []).find((r) => r.id === target.id);
            check(updated?.status === flipStatus, `${s.label}: status persisted as '${flipStatus}' (got '${updated?.status}')`);

            // Restore
            await gql({
                origin: CLUB_ORIGIN, token,
                query: s.mut,
                variables: {ids: [target.id], status: originalStatus, note: originalNote ?? null},
            });
            const restored = (await gql({origin: CLUB_ORIGIN, token, query: s.listQ, variables: {idClub}}))?.[s.listKey] || [];
            const back = restored.find((r) => r.id === target.id);
            check(back?.status === originalStatus, `${s.label}: original status restored to '${originalStatus}'`);
        } catch (e) {
            check(false, `${s.label}: round-trip threw → ${e.message}`);
        }
    }
}

async function run() {
    info(`API: ${API}`);
    info(`Origin: ${CLUB_ORIGIN}`);
    info(`Mode: ${WRITE ? "WRITE (phase A + B)" : "READ-ONLY (phase A only, pass WRITE=1 to enable B)"}`);

    log(`\n${c.yellow}1)${c.reset} Login as club admin → ${CLUB_EMAIL}`);
    const auth = await gql({origin: CLUB_ORIGIN, query: Q_LOGIN, variables: {content: {email: CLUB_EMAIL, password: CLUB_PASSWORD}}});
    if (!auth?.authenticateUser?.token) throw new Error("club login returned no token");
    const token = auth.authenticateUser.token;
    ok("logged in");

    log(`\n${c.yellow}2)${c.reset} currentUser → resolve idClub`);
    const me = await gql({origin: CLUB_ORIGIN, token, query: Q_CURRENT_USER});
    const idClub = ID_CLUB_OVR || me?.currentUser?.person?.member?.team?.club?.id;
    if (!idClub) throw new Error("could not resolve idClub from currentUser — set ID_CLUB env to override");
    ok(`idClub=${idClub}`);

    await phaseEmpty(token);

    if (WRITE) {
        await phaseRoundTrip(token, idClub);
    } else {
        info("\nSkipping Phase B (set WRITE=1 to run round-trip on real rows)");
    }

    log("");
    if (failures === 0) {
        log(`${c.green}━━━ All bulk-mutation checks passed ━━━${c.reset}`);
        process.exit(0);
    } else {
        log(`${c.red}━━━ ${failures} check(s) failed ━━━${c.reset}`);
        process.exit(1);
    }
}

run().catch((e) => {
    bad(`${e.message}${e.code ? ` (${e.code})` : ""}`);
    if (e.payload) console.error(JSON.stringify(e.payload, null, 2));
    process.exit(1);
});
