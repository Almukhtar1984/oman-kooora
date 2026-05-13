#!/usr/bin/env node
/**
 * End-to-end smoke test for the "club admin creates a team manager → that
 * team manager can log into the team app" flow.
 *
 *   API=https://api.omkooora.com \
 *   CLUB_ORIGIN=https://club.omkooora.com \
 *   TEAM_ORIGIN=https://team.omkooora.com \
 *   CLUB_EMAIL='clubadmin@example.com' \
 *   CLUB_PASSWORD='...' \
 *   node tests/test-team-flow.mjs
 *
 * Defaults target localhost (API_PORT=7000) and the local dev origins. The
 * script creates real rows; pass DRY_RUN=1 to skip team creation and only
 * exercise authentication.
 */

const API           = (process.env.API           || 'http://localhost:7000').replace(/\/$/, '');
const CLUB_ORIGIN   =  process.env.CLUB_ORIGIN   || 'http://localhost:3001';
const TEAM_ORIGIN   =  process.env.TEAM_ORIGIN   || 'http://localhost:3002';
const CLUB_EMAIL    =  process.env.CLUB_EMAIL    || 'clubadmin@example.com';
const CLUB_PASSWORD =  process.env.CLUB_PASSWORD || 'change-me';
const ID_CLUB       =  process.env.ID_CLUB       || null;
const DRY_RUN       =  process.env.DRY_RUN === '1';

const stamp     = Date.now();
const teamName  = `Test Team ${stamp}`;
const mgrEmail  = `mgr_${stamp}@example.com`;
const mgrPass   = `Tt${stamp}!Aa`;
const cardNum   = String(stamp).slice(-9);

const c = {
    reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
    yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m',
};
const log  = (msg) => console.log(msg);
const ok   = (msg) => log(`${c.green}✓${c.reset} ${msg}`);
const bad  = (msg) => log(`${c.red}✗${c.reset} ${msg}`);
const info = (msg) => log(`${c.cyan}ℹ${c.reset} ${c.dim}${msg}${c.reset}`);

async function gql({origin, token, query, variables}) {
    const res = await fetch(`${API}/graphql`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            ...(origin ? {origin} : {}),
            ...(token ? {authorization: token} : {}),
        },
        body: JSON.stringify({query, variables}),
    });
    const json = await res.json().catch(() => ({errors: [{message: 'invalid JSON response'}]}));
    if (json.errors) {
        const err = new Error(json.errors[0]?.message || 'GraphQL error');
        err.code = json.errors[0]?.extensions?.code;
        err.payload = json;
        throw err;
    }
    return json.data;
}

const Q_LOGIN = `
    mutation($content: loginInfo) {
        authenticateUser(content: $content) {
            token
            user { id email role }
        }
    }`;

const Q_CURRENT_USER = `
    query {
        currentUser {
            id email role
            permission { members players teams }
            person { id member { id team { id name club { id name } } } }
        }
    }`;

const Q_CREATE_TEAM = `
    mutation($content: contentTeam!) {
        createTeam(content: $content) { id name }
    }`;

const Q_CREATE_ADMIN_MEMBER = `
    mutation($content: contentAdminMember!) {
        createAdminMember(content: $content) { id }
    }`;

async function run() {
    info(`API: ${API}`);
    info(`Club origin: ${CLUB_ORIGIN}`);
    info(`Team origin: ${TEAM_ORIGIN}`);
    log('');

    // 1) Club admin login
    log(`${c.yellow}1)${c.reset} Login as club admin → ${CLUB_EMAIL}`);
    const clubAuth = await gql({
        origin: CLUB_ORIGIN,
        query: Q_LOGIN,
        variables: {content: {email: CLUB_EMAIL, password: CLUB_PASSWORD}},
    });
    if (!clubAuth?.authenticateUser?.token) throw new Error('club login returned no token');
    const clubToken = clubAuth.authenticateUser.token;
    ok('club admin logged in');

    // 2) Verify currentUser (club side) → get id_club if not supplied
    log(`${c.yellow}2)${c.reset} currentUser (club)`);
    const clubMe = await gql({origin: CLUB_ORIGIN, token: clubToken, query: Q_CURRENT_USER});
    const idClub = ID_CLUB || clubMe?.currentUser?.person?.member?.team?.club?.id;
    if (!idClub) {
        info('No id_club resolvable from currentUser → set ID_CLUB env to override.');
    }
    ok(`role=${clubMe.currentUser.role}, id=${clubMe.currentUser.id}`);

    if (DRY_RUN) {
        info('DRY_RUN=1 → stopping before mutations');
        return;
    }

    // 3) Create a team
    log(`${c.yellow}3)${c.reset} createTeam ← "${teamName}"`);
    const created = await gql({
        origin: CLUB_ORIGIN, token: clubToken,
        query: Q_CREATE_TEAM,
        variables: {content: {
            name: teamName, category: 1, phone: '99999999', activities: 'كرة القدم',
            code: `T${stamp}`, manager_name: 'Test Manager', id_club: idClub,
        }},
    });
    const teamId = created.createTeam.id;
    ok(`team created id=${teamId}`);

    // 4) Create admin-member for the team
    log(`${c.yellow}4)${c.reset} createAdminMember`);
    await gql({
        origin: CLUB_ORIGIN, token: clubToken,
        query: Q_CREATE_ADMIN_MEMBER,
        variables: {content: {
            occupation: 'مدير الفريق',
            classification: 'manager',
            membership_date: new Date().toISOString().slice(0, 10),
            membership_date_end: '',
            id_team: teamId,
            user: {
                email: mgrEmail,
                password: mgrPass,
                role: '3',
                person: {
                    first_name: 'Test', second_name: 'Manager', third_name: 'X',
                    tribe: 'Smoke', phone: `5${stamp}`.slice(0, 9),
                    card_number: cardNum, date_birth: '1990-01-01',
                },
            },
        }},
    });
    ok(`manager user created ← ${mgrEmail}`);

    // 5) Manager logs in via the team app
    log(`${c.yellow}5)${c.reset} Login manager on team origin`);
    const mgrAuth = await gql({
        origin: TEAM_ORIGIN,
        query: Q_LOGIN,
        variables: {content: {email: mgrEmail, password: mgrPass}},
    });
    if (!mgrAuth?.authenticateUser?.token) throw new Error('manager login returned no token');
    ok('manager logged in');

    // 6) currentUser on team side — verify person.member.team + permission
    log(`${c.yellow}6)${c.reset} currentUser (team) — verify wiring`);
    const mgrMe = await gql({origin: TEAM_ORIGIN, token: mgrAuth.authenticateUser.token, query: Q_CURRENT_USER});
    if (mgrMe.currentUser.role !== '3') throw new Error(`expected role=3, got ${mgrMe.currentUser.role}`);
    if (mgrMe.currentUser.person?.member?.team?.id !== teamId)
        throw new Error('manager.person.member.team.id mismatch with created team');
    if (!mgrMe.currentUser.permission)
        throw new Error('manager has no permission row (sidebar would render empty)');
    ok(`role=3, team=${mgrMe.currentUser.person.member.team.name}`);
    ok(`permission.teams=${mgrMe.currentUser.permission.teams || '∅'}`);

    log('');
    log(`${c.green}━━━ All checks passed ━━━${c.reset}`);
}

run().catch((e) => {
    bad(`${e.message}${e.code ? ` (${e.code})` : ''}`);
    if (e.payload) console.error(JSON.stringify(e.payload, null, 2));
    process.exit(1);
});
