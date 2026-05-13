#!/usr/bin/env node
/**
 * Smoke test for the "add manager to an existing team" path the club
 * dashboard hits when an admin presses "إضافة مدير" on a team that has
 * none. This is a separate flow from createTeamWithAdmin (which creates
 * both the team and its manager in one go) and exercises
 * createAdminMember directly.
 *
 *   API=https://api.omkooora.com \
 *   CLUB_ORIGIN=https://club.omkooora.com \
 *   TEAM_ORIGIN=https://team.omkooora.com \
 *   CLUB_EMAIL='clubadmin@example.com' \
 *   CLUB_PASSWORD='...' \
 *   ID_CLUB='<uuid>' \
 *   ID_TEAM='<existing-team-uuid-without-manager>' \
 *   node tests/test-add-manager-flow.mjs
 *
 * If ID_TEAM is omitted the script first creates a fresh team via
 * createTeam (no manager) and uses that — handy for repeatedly running
 * the full smoke pass against staging.
 */

const API           = (process.env.API           || 'http://localhost:7000').replace(/\/$/, '');
const CLUB_ORIGIN   =  process.env.CLUB_ORIGIN   || 'http://localhost:3001';
const TEAM_ORIGIN   =  process.env.TEAM_ORIGIN   || 'http://localhost:3002';
const CLUB_EMAIL    =  process.env.CLUB_EMAIL    || 'clubadmin@example.com';
const CLUB_PASSWORD =  process.env.CLUB_PASSWORD || 'change-me';
const ID_CLUB       =  process.env.ID_CLUB       || null;
let   ID_TEAM       =  process.env.ID_TEAM       || null;

const stamp    = Date.now();
const mgrEmail = `mgr_add_${stamp}@example.com`;
const mgrPass  = `Tt${stamp}!Aa`;
const cardNum  = String(stamp).slice(-9);

const c = {reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m'};
const log  = (m) => console.log(m);
const ok   = (m) => log(`${c.green}✓${c.reset} ${m}`);
const bad  = (m) => log(`${c.red}✗${c.reset} ${m}`);
const info = (m) => log(`${c.cyan}ℹ${c.reset} ${c.dim}${m}${c.reset}`);

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
        authenticateUser(content: $content) { token user { id email role } }
    }`;

const Q_CURRENT_USER = `
    query {
        currentUser {
            id email role
            permission { members players teams }
            person { id member { id team { id name } } }
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
    log('');

    // 1) Club admin login
    log(`${c.yellow}1)${c.reset} Login as club admin`);
    const clubAuth = await gql({
        origin: CLUB_ORIGIN, query: Q_LOGIN,
        variables: {content: {email: CLUB_EMAIL, password: CLUB_PASSWORD}},
    });
    const clubToken = clubAuth?.authenticateUser?.token;
    if (!clubToken) throw new Error('club login returned no token');
    ok('club admin logged in');

    // 2) Optionally create a teams-only team to attach a manager to.
    if (!ID_TEAM) {
        log(`${c.yellow}2)${c.reset} No ID_TEAM provided → creating a fresh manager-less team`);
        if (!ID_CLUB) throw new Error('ID_CLUB env var required when ID_TEAM is omitted');
        const created = await gql({
            origin: CLUB_ORIGIN, token: clubToken,
            query: Q_CREATE_TEAM,
            variables: {content: {
                name: `AddMgr Test ${stamp}`, category: 1, phone: '88888888',
                activities: 'كرة القدم', code: `M${stamp}`, manager_name: 'Pending',
                id_club: ID_CLUB,
            }},
        });
        ID_TEAM = created.createTeam.id;
        ok(`team created id=${ID_TEAM}`);
    } else {
        info(`Using existing team id=${ID_TEAM}`);
    }

    // 3) Validation guards — make sure server rejects bad inputs.
    log(`${c.yellow}3)${c.reset} Validation: invalid role should be refused`);
    try {
        await gql({
            origin: CLUB_ORIGIN, token: clubToken,
            query: Q_CREATE_ADMIN_MEMBER,
            variables: {content: {
                classification: 'manager', occupation: 'مدير الفريق',
                membership_date: '2026-01-01', membership_date_end: '',
                id_team: ID_TEAM,
                user: {
                    email: `bad_${stamp}@example.com`, password: 'whatever', role: '1',
                    person: {first_name: 'X', second_name: 'Y', third_name: '', tribe: 'Z',
                        phone: '99000000', card_number: `1${stamp}`.slice(0, 9), date_birth: '1990-01-01'},
                },
            }},
        });
        throw new Error('server accepted role=1 (super-admin escalation)!');
    } catch (e) {
        if (e.code !== 'FORBIDDEN_ROLE') throw e;
        ok('role=1 rejected as FORBIDDEN_ROLE');
    }

    // 4) Happy path: create manager (role 3)
    log(`${c.yellow}4)${c.reset} createAdminMember (role=3) → ${mgrEmail}`);
    await gql({
        origin: CLUB_ORIGIN, token: clubToken,
        query: Q_CREATE_ADMIN_MEMBER,
        variables: {content: {
            occupation: 'مدير الفريق', classification: 'manager',
            membership_date: new Date().toISOString().slice(0, 10), membership_date_end: '',
            id_team: ID_TEAM,
            user: {
                email: mgrEmail, password: mgrPass, role: '3',
                person: {
                    first_name: 'AddMgr', second_name: 'Test', third_name: '', tribe: 'Smoke',
                    phone: `7${stamp}`.slice(0, 9), card_number: cardNum, date_birth: '1990-01-01',
                },
            },
        }},
    });
    ok(`manager created`);

    // 5) Duplicate card_number should fail cleanly
    log(`${c.yellow}5)${c.reset} Validation: duplicate card_number must fail`);
    try {
        await gql({
            origin: CLUB_ORIGIN, token: clubToken,
            query: Q_CREATE_ADMIN_MEMBER,
            variables: {content: {
                occupation: 'مدير الفريق', classification: 'manager',
                membership_date: new Date().toISOString().slice(0, 10), membership_date_end: '',
                id_team: ID_TEAM,
                user: {
                    email: `dup_${stamp}@example.com`, password: mgrPass, role: '3',
                    person: {
                        first_name: 'Dup', second_name: 'User', third_name: '', tribe: 'Smoke',
                        phone: `7${stamp + 1}`.slice(0, 9), card_number: cardNum, date_birth: '1990-01-01',
                    },
                },
            }},
        });
        throw new Error('duplicate card_number was accepted');
    } catch (e) {
        if (e.code !== 'CARD_NUMBER_ALREADY_EXISTS') throw e;
        ok('duplicate card_number rejected');
    }

    // 6) Manager can log into the team app and currentUser exposes the team + permission
    log(`${c.yellow}6)${c.reset} Login manager on team origin`);
    const mgrAuth = await gql({
        origin: TEAM_ORIGIN, query: Q_LOGIN,
        variables: {content: {email: mgrEmail, password: mgrPass}},
    });
    if (!mgrAuth?.authenticateUser?.token) throw new Error('manager login returned no token');
    ok('manager logged in');

    log(`${c.yellow}7)${c.reset} currentUser (team)`);
    const me = await gql({origin: TEAM_ORIGIN, token: mgrAuth.authenticateUser.token, query: Q_CURRENT_USER});
    if (me.currentUser.role !== '3') throw new Error(`expected role=3, got ${me.currentUser.role}`);
    if (me.currentUser.person?.member?.team?.id !== ID_TEAM)
        throw new Error('manager.person.member.team.id does not match ID_TEAM');
    if (!me.currentUser.permission)
        throw new Error('manager has no permission row (sidebar would render empty)');
    ok(`team=${me.currentUser.person.member.team.name}, permission ok`);

    log('');
    log(`${c.green}━━━ All checks passed ━━━${c.reset}`);
}

run().catch((e) => {
    bad(`${e.message}${e.code ? ` (${e.code})` : ''}`);
    if (e.payload) console.error(JSON.stringify(e.payload, null, 2));
    process.exit(1);
});
