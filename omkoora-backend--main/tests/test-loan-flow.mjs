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
 *   4. Only a party to the transfer may cancel, return, delete or re-date it —
 *      these mutations used to trust any logged-in caller holding the UUID.
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

// Slice one function's body by matching its braces, so assertions stay scoped
// to it without a fixed character window — the resolvers grew (club chain,
// request road) and pushed later steps past the old 1400/2400-char cut-off.
// Matches a resolver (`name: async`) or a module-level `const name = async`;
// `length` stays as the fallback when the braces don't pair.
const sliceFn = (src, name, length = 1800) => {
    const m = src.match(new RegExp(`${name}\\s*[:=]\\s*async`));
    if (!m || m.index === undefined) return "";

    // Start at the arrow body, not at the destructured-args braces in
    // `async (obj, { id }, context, info) =>`.
    const arrow = src.indexOf("=>", m.index);
    const open = arrow === -1 ? -1 : src.indexOf("{", arrow);
    if (open === -1) return src.slice(m.index, m.index + length);

    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}" && --depth === 0) return src.slice(m.index, i + 1);
    }
    return src.slice(m.index, m.index + length);
};

const BACKEND = "omkoora-backend--main";
const TEAM = "client/omkoora-team--main";

// ── Backend: notification helper ─────────────────────────────────────────────
console.log(`${c.cyan}▶ Notification helper (loan category)${c.reset}`);
{
    const src = read(BACKEND, "src", "Helpers", "Notification.mjs");
    assert(src !== "", "Notification.mjs exists");
    // Scope to the case up to its own `break` — a fixed window fell short once
    // the case started naming technical staff as well as players.
    const loanStart = src.indexOf('case "loan"');
    const loanCase = loanStart === -1 ? "" : src.slice(loanStart, src.indexOf("break", loanStart));
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
    // The same import also brings CreateNotificationClub (the club chain), so
    // accept any named-import list that includes CreateNotificationTeam.
    assert(
        /import\s*\{[^}]*\bCreateNotificationTeam\b[^}]*\}\s*from\s*["'][^"']*Helpers\/index\.mjs["']/.test(src),
        "imports CreateNotificationTeam from Helpers/index.mjs"
    );

    const create = sliceFn(src, "createTransfer");
    assert(/transition_type\s*===\s*"loan"/.test(create), "createTransfer detects a loan");
    assert(
        /CreateNotificationTeam\(\s*"loan"\s*,\s*"request"\s*,\s*content\.id_team_to/.test(create),
        "createTransfer notifies the receiving team on a pending loan request"
    );

    const update = sliceFn(src, "updateTransfer");
    assert(/Transfer\.findByPk\(\s*id\s*\)/.test(update), "updateTransfer loads the transfer first");
    assert(
        /content\.id_player\s*\|\|\s*transfer\.id_player/.test(update),
        "updateTransfer falls back to the stored id_player"
    );

    // The destination team is no longer `content.id_team_to || transfer.id_team_to`:
    // only the receiving club may name it (team names repeat across clubs), so
    // resolveDestinationTeam keeps the stored team whenever nothing — or nothing
    // trustworthy — is requested. The fallback lives in that helper now.
    const flow = read(BACKEND, "src", "Helpers", "transferFlow.mjs");
    assert(
        /resolveDestinationTeam\(\s*\{\s*storedTeamId\s*:\s*transfer\.id_team_to/.test(update) &&
            /requestedTeamId\s*:\s*content\.id_team_to/.test(update) &&
            /id_team_to\s*:\s*idTeamTo/.test(update) &&
            /if\s*\(\s*!requestedTeamId\s*\)\s*return\s+storedTeamId/.test(flow),
        "updateTransfer falls back to the stored id_team_to"
    );

    // On the request road the player moves — and the lending team hears the
    // answer — only at the road's end (requestOutcomes.mjs): finalizeTransfer on
    // the final approval, abandonTransfer on a rejection. A request with no road
    // still rejects in updateTransfer itself, so reject is guarded on both paths.
    const outcomes = read(BACKEND, "src", "Helpers", "requestOutcomes.mjs");
    const finalize = sliceFn(outcomes, "finalizeTransfer");
    const abandon = sliceFn(outcomes, "abandonTransfer");
    assert(
        /CreateNotificationTeam\(\s*"loan"\s*,\s*"accepted"\s*,\s*transfer\.id_team_from/.test(finalize) &&
            /finalize\s*:\s*finalizeTransfer/.test(outcomes),
        "the road's final approval notifies the lending team on accept"
    );
    assert(
        /CreateNotificationTeam\(\s*"loan"\s*,\s*"rejected"\s*,\s*transfer\.id_team_from/.test(abandon) &&
            /abandon\s*:\s*abandonTransfer/.test(outcomes),
        "the road's rejection notifies the lending team on reject"
    );
    assert(
        /CreateNotificationTeam\(\s*"loan"\s*,\s*"rejected"\s*,\s*transfer\.id_team_from/.test(update),
        "updateTransfer notifies the lending team on reject (request with no road)"
    );

    // Cancelling a still-pending loan from the loans page used to soft-delete
    // the transfer and leave its road open: the player stayed waiting_club and
    // the unpaid charge stayed on the team. The road is closed first now.
    const back = sliceFn(src, "BackToOldTeamTransfer", 4000);
    const withdrawAt = back.indexOf("withdrawFlow(");
    assert(
        withdrawAt !== -1 && withdrawAt < back.indexOf("DB.transaction("),
        "BackToOldTeamTransfer closes a pending loan's road before removing it"
    );
    const del = sliceFn(src, "deleteTransfer");
    assert(
        del.indexOf("withdrawFlow(") !== -1 && del.indexOf("withdrawFlow(") < del.indexOf("Transfer.destroy("),
        "deleteTransfer closes the road before removing the transfer"
    );
}

// ── Backend: who may touch a transfer ────────────────────────────────────────
console.log(`${c.cyan}▶ Transfer resolver (ownership)${c.reset}`);
{
    const src = read(BACKEND, "src", "Graphql", "Resolvers", "Transfer.mjs");

    // The rule itself: super-admin passes; a team only on its own team's
    // transfer; a club on its own club's, read from the stored id_club_* and from
    // both teams' clubs (older rows never had id_club_* filled); everyone else
    // is refused with a code the client can read.
    const party = sliceFn(src, "assertTransferParty");
    assert(party !== "", "Transfer.mjs defines assertTransferParty");
    assert(
        /role\s*===\s*SUPER_ADMIN_ROLE\s*\)\s*return/.test(party) && /SUPER_ADMIN_ROLE\s*=\s*"1"/.test(src),
        "the super-admin may act on any transfer"
    );
    assert(
        /callerTeamId\(\s*context\s*\)/.test(party) &&
            /\[\s*transfer\.id_team_from\s*,\s*transfer\.id_team_to\s*\]\.includes\(\s*myTeam\s*\)/.test(party),
        "a team may act only when it is id_team_from or id_team_to"
    );
    assert(
        /callerClubId\(\s*context\s*\)/.test(party) &&
            /clubOfTeam\(\s*transfer\.id_team_from\s*\)/.test(party) &&
            /clubOfTeam\(\s*transfer\.id_team_to\s*\)/.test(party) &&
            /transfer\.id_club_from/.test(party) && /transfer\.id_club_to/.test(party),
        "a club may act when it is the from- or to-club, resolved through the teams too"
    );
    assert(
        /throw\s+new\s+ApolloError\(\s*"[^"]+"\s*,\s*"TRANSFER_NOT_YOURS"\s*\)/.test(party),
        "anyone else is refused with TRANSFER_NOT_YOURS"
    );

    // Each mutation checks the caller on the row it loaded, before the first
    // write — and keeps the refusal's code instead of re-wrapping it.
    const guards = [
        ["BackToOldTeamTransfer", ["withdrawFlow(", "DB.transaction("]],
        ["deleteTransfer", ["withdrawFlow(", "Transfer.destroy("]],
        ["updateLoan", ["Transfer.update("]],
    ];
    for (const [name, writes] of guards) {
        const fn = sliceFn(src, name);
        const loadAt = fn.indexOf("Transfer.findByPk(");
        const checkAt = fn.indexOf("assertTransferParty(context, transfer)");
        assert(
            loadAt !== -1 && checkAt > loadAt && writes.every((w) => fn.indexOf(w) > checkAt),
            `${name} checks the caller is a party before ${writes.join(" / ")}`
        );
        assert(
            /error\s+instanceof\s+ApolloError\s*\)\s*throw\s+error/.test(fn),
            `${name} rethrows TRANSFER_NOT_YOURS with its code`
        );
    }

    // Ended loans are soft-deleted by loanCleanup, and the loans page still
    // cancels them — the ownership check must not bring back a paranoid read.
    assert(
        /Transfer\.findByPk\(\s*id\s*,\s*\{\s*paranoid\s*:\s*false\s*\}\s*\)/.test(sliceFn(src, "BackToOldTeamTransfer")),
        "BackToOldTeamTransfer still reads ended (soft-deleted) loans"
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

// ── Team app: discoverability (nav + loan button + barrel) ───────────────────
console.log(`${c.cyan}▶ Team app — discoverability${c.reset}`);
{
    // The rendered top nav is HorizontalNavbar (Layout renders it, NOT Sidebar).
    const layout = read(TEAM, "components", "Layout", "Layout.tsx");
    assert(/HorizontalNavbar/.test(layout), "Layout renders HorizontalNavbar (the real nav)");

    const nav = read(TEAM, "components", "Layout", "HorizontalNavbar.tsx");
    assert(/path:\s*['"]\/players_loan['"]/.test(nav), "HorizontalNavbar links to /players_loan");
    // Loans now sit under the «الطلبات» section, labelled 'الإعارات'.
    assert(/path:\s*['"]\/players_loan['"]\s*,\s*label:\s*['"]الإعارات['"]/.test(nav),
        "nav shows the loan label");

    // The player card the user actually manages players from must offer the loan
    // action, wired to the onLoanPlayer handler the page passes down.
    const card = read(TEAM, "components", "Card", "MemberCard.tsx");
    assert(/إعارة اللاعب/.test(card) && /onLoanPlayer\s*&&\s*onLoanPlayer\(data\)/.test(card),
        "MemberCard has an 'إعارة اللاعب' action wired to onLoanPlayer");

    // The home page renders MemberCard and passes a working loan handler + modal.
    const home = read(TEAM, "pages", "index.tsx");
    assert(/onLoanPlayer=\{handleLoanPlayer\}/.test(home), "home page passes the loan handler to cards");
    assert(/PlayersLoanModal/.test(home), "home page mounts the loan modal");

    // The /players page table also exposes the action.
    const roster = read(TEAM, "components", "Tables", "PlayersTable.tsx");
    assert(/إعارة اللاعب/.test(roster) && /openModelLoan\(item\?\.id\)/.test(roster),
        "players-page table has an 'إعارة اللاعب' action");

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
