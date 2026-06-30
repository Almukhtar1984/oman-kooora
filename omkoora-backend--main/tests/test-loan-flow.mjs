#!/usr/bin/env node
/**
 * Static guard for the player loan (إعارة) flow across the backend and the
 * team dashboard. These assertions lock in the three behaviours the feature
 * promises — and the specific bugs that were fixed while completing it:
 *
 *   1. A loan request notifies the RECEIVING team.
 *   2. Accept/reject moves the player using reliable ids (the modal used to
 *      send only {status}, silently unsetting the player's team) and notifies
 *      the LENDING team.
 *   3. When the loan period ends the player returns to the ORIGINAL team
 *      (id_team_from) — the cron previously used id_team_to, the wrong team.
 *
 * Pure text checks: no DB, no network. Run with:
 *   node tests/test-loan-flow.mjs
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
    try {
        return readFileSync(resolve(root, ...parts), "utf8");
    } catch {
        return "";
    }
};

// Take ~N chars after a named resolver opens so assertions stay scoped to it.
const sliceFn = (src, name, length = 1400) => {
    const m = src.match(new RegExp(`${name}\\s*:\\s*async`));
    if (!m || m.index === undefined) return "";
    return src.slice(m.index, m.index + length);
};

const BACKEND = "omkoora-backend--main";
const TEAM = "client/omkoora-team--main";

// ── Backend: notification helper ─────────────────────────────────────────────
console.log(`${c.cyan}▶ Notification helper (loan category)${c.reset}`);
{
    const src = read(BACKEND, "src", "Helpers", "Notification.mjs");
    assert(src !== "", "Notification.mjs exists");
    const loanCase = src.slice(src.indexOf('case "loan"'), src.indexOf('case "loan"') + 600);
    assert(/case\s*"loan"\s*:/.test(src), 'CreateNotificationTeam has a "loan" case');
    assert(/FunctionType\s*===\s*"request"/.test(loanCase), "handles request");
    assert(/FunctionType\s*===\s*"accepted"/.test(loanCase), "handles accepted");
    assert(/FunctionType\s*===\s*"rejected"/.test(loanCase), "handles rejected");
    assert(/FunctionType\s*===\s*"returned"/.test(loanCase), "handles returned");
}

// ── Backend: Transfer resolver ───────────────────────────────────────────────
console.log(`${c.cyan}▶ Transfer resolver (create / update)${c.reset}`);
{
    const src = read(BACKEND, "src", "Graphql", "Resolvers", "Transfer.mjs");
    assert(src !== "", "Transfer.mjs exists");
    assert(
        /import\s*\{\s*CreateNotificationTeam\s*\}\s*from\s*["'][^"']*Helpers\/index\.mjs["']/.test(src),
        "imports CreateNotificationTeam from Helpers/index.mjs"
    );

    const create = sliceFn(src, "createTransfer");
    assert(/transition_type\s*===\s*"loan"/.test(create), "createTransfer detects a loan");
    assert(
        /CreateNotificationTeam\(\s*"loan"\s*,\s*"request"\s*,\s*content\.id_team_to/.test(create),
        "createTransfer notifies the receiving team on a pending loan request"
    );

    const update = sliceFn(src, "updateTransfer", 2400);
    assert(/Transfer\.findByPk\(\s*id\s*\)/.test(update), "updateTransfer loads the transfer first");
    assert(
        /content\.id_player\s*\|\|\s*transfer\.id_player/.test(update),
        "updateTransfer falls back to the stored id_player"
    );
    assert(
        /content\.id_team_to\s*\|\|\s*transfer\.id_team_to/.test(update),
        "updateTransfer falls back to the stored id_team_to"
    );
    assert(
        /CreateNotificationTeam\(\s*"loan"\s*,\s*"accepted"\s*,\s*transfer\.id_team_from/.test(update),
        "updateTransfer notifies the lending team on accept"
    );
    assert(
        /CreateNotificationTeam\(\s*"loan"\s*,\s*"rejected"\s*,\s*transfer\.id_team_from/.test(update),
        "updateTransfer notifies the lending team on reject"
    );
}

// ── Backend: auto-return cron ────────────────────────────────────────────────
console.log(`${c.cyan}▶ Loan auto-return cron${c.reset}`);
{
    const src = read(BACKEND, "src", "Schedule", "loanCleanup.mjs");
    assert(src !== "", "loanCleanup.mjs exists");
    assert(/transition_type\s*:\s*['"]loan['"]/.test(src), "scoped to loan transfers only");
    assert(/status\s*:\s*['"]accepted['"]/.test(src), "scoped to accepted loans only");
    assert(/date_end\s*:\s*\{\s*\[Op\.lt\]/.test(src), "filters loans whose date_end has passed");
    assert(
        /id_team\s*:\s*loan\.id_team_from/.test(src),
        "returns the player to id_team_from (the original team)"
    );
    assert(
        !/id_team\s*:\s*(loan|transfer)\.id_team_to/.test(src),
        "does NOT send the player to id_team_to on return (the old bug)"
    );
    assert(/CreateNotificationTeam\(\s*"loan"\s*,\s*"returned"/.test(src), "notifies on auto-return");
    assert(/Schedule\/index\.mjs/.test(read(BACKEND, "src", "Schedule", "index.mjs")) ||
        /loanCleanup/.test(read(BACKEND, "src", "Schedule", "index.mjs")), "registered in the cron index");
}

// ── Team app: loan creation modal ────────────────────────────────────────────
console.log(`${c.cyan}▶ Team app — create loan modal${c.reset}`);
{
    const src = read(TEAM, "components", "Modal", "PlayersLoanModal.tsx");
    assert(src !== "", "PlayersLoanModal.tsx exists");
    assert(/transition_type:\s*"loan"/.test(src), "creates a loan transfer");
    assert(/status:\s*"waiting"/.test(src), "uses the valid enum status 'waiting'");
    assert(!/waiting_team/.test(src), "no dead 'waiting_team' status");
}

// ── Team app: loans page + accept/reject ─────────────────────────────────────
console.log(`${c.cyan}▶ Team app — loans page${c.reset}`);
{
    const page = read(TEAM, "pages", "players_loan.tsx");
    assert(page !== "", "players_loan.tsx exists");
    assert(/PlayersTableLoan/.test(page), "renders the loans table");
    assert(/transitionType:\s*\[\s*"loan"\s*,\s*"returning"\s*\]/.test(page), "queries loan + returning transfers");
    assert(/status\s*===\s*"waiting"\s*&&\s*item\?\.team_to\?\.id\s*===\s*idTeam/.test(page),
        "alerts on pending incoming requests for THIS team");

    const table = read(TEAM, "components", "Tables", "PlayersTableLoan.tsx");
    assert(table !== "", "PlayersTableLoan.tsx exists");
    assert(/openModelUpdate\(item,\s*"accepted"\)/.test(table), "accept sets status 'accepted' (immediate move)");
    assert(/openModelUpdate\(item,\s*"rejected"\)/.test(table), "reject sets status 'rejected'");
    assert(/status\s*==\s*"waiting"\s*&&\s*item\?\.team_to\?\.id\s*===\s*idTeam/.test(table),
        "only the receiving team sees accept/reject");
    assert(!/waiting_club_1/.test(table), "no dead 'waiting_club_1' state");

    const modal = read(TEAM, "components", "Modal", "UpdatePlayersTransferModal.tsx");
    assert(modal !== "", "UpdatePlayersTransferModal.tsx exists");
    assert(/id_player:\s*data\?\.player\?\.id/.test(modal), "accept/reject sends id_player");
    assert(/id_team_to:\s*data\?\.team_to\?\.id/.test(modal), "accept/reject sends id_team_to");
}

// ── Team app: discoverability (roster button + sidebar + barrel) ─────────────
console.log(`${c.cyan}▶ Team app — discoverability${c.reset}`);
{
    const roster = read(TEAM, "components", "Tables", "PlayersTable.tsx");
    assert(/إعارة اللاعب/.test(roster) && /openModelLoan\(item\?\.id\)/.test(roster),
        "roster has an 'إعارة اللاعب' action");

    const sidebar = read(TEAM, "components", "Layout", "Sidebar.tsx");
    assert(/["']\/players_loan["']/.test(sidebar), "sidebar links to /players_loan");
    assert(/إعارة اللاعبين/.test(sidebar), "sidebar shows the loan label");

    const barrel = read(TEAM, "components", "Tables", "index.ts");
    assert(/PlayersTableLoan/.test(barrel), "PlayersTableLoan is exported from the Tables barrel");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All loan-flow guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} loan-flow guard(s) failed.${c.reset}`);
    process.exit(1);
}
