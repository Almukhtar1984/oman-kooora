#!/usr/bin/env node
/**
 * Static guard for the loan-return → LEAGUE-squad cleanup fix.
 *
 * The bug: returning a loaned player restored players.id_team and soft-deleted
 * the transfer, but left the player enrolled in the RECEIVING team's league
 * squad (ParticipatingPlayers is read by id_participating_team, not by the
 * player's current id_team — so the row lingered in the league dashboard).
 *
 * These assertions lock in the fix on BOTH return paths (the
 * BackToOldTeamTransfer resolver AND the loanCleanup cron), the shared helper,
 * the paranoid-aware "latest transfer" subquery, and the backfill script.
 *
 * Pure text checks: no DB, no network. Run with:
 *   node tests/test-loan-return-league.mjs
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m" };
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
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

// Slice one resolver's body by matching its braces, so a resolver that grows
// past a fixed character window does not silently drop its later steps out of
// the guards below (`length` stays as the fallback when the braces don't pair).
const sliceFn = (src, name, length = 1800) => {
    const m = src.match(new RegExp(`${name}\\s*:\\s*async`));
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

// ── Shared helper ────────────────────────────────────────────────────────────
console.log(`${c.cyan}▶ Shared receiving-team cleanup helper${c.reset}`);
{
    const src = read(BACKEND, "src", "Helpers", "LoanReturn.mjs");
    assert(src !== "", "LoanReturn.mjs exists");
    assert(/export\s+async\s+function\s+removeReceivingTeamParticipations/.test(src),
        "exports removeReceivingTeamParticipations(idPlayer, idTeamTo, transaction)");
    assert(/ParticipatingTeams\.findAll/.test(src) && /id_team\s*:\s*idTeamTo/.test(src),
        "finds the RECEIVING team's participations by id_team = idTeamTo");
    assert(/ParticipatingPlayers\.destroy/.test(src),
        "deletes ParticipatingPlayers enrolments");
    assert(/id_player\s*:\s*idPlayer/.test(src) && /id_participating_team\s*:\s*\{\s*\[Op\.in\]/.test(src),
        "scopes the delete to the player AND the receiving team's participations only");
    assert(/transaction/.test(src), "threads a transaction through");
}

// ── Resolver return path: BackToOldTeamTransfer ──────────────────────────────
console.log(`${c.cyan}▶ BackToOldTeamTransfer resolver${c.reset}`);
{
    const src = read(BACKEND, "src", "Graphql", "Resolvers", "Transfer.mjs");
    assert(src !== "", "Transfer.mjs exists");
    assert(/removeReceivingTeamParticipations/.test(src) && /LoanReturn\.mjs/.test(src),
        "imports the shared cleanup helper");

    const fn = sliceFn(src, "BackToOldTeamTransfer");
    assert(/DB\.transaction\(/.test(fn), "wraps the whole return in a DB transaction");
    assert(/id_team\s*:\s*transfer\.id_team_from/.test(fn),
        "restores the player to id_team_from (the original team)");
    assert(/removeReceivingTeamParticipations\(\s*transfer\.id_player\s*,\s*transfer\.id_team_to/.test(fn),
        "clears the league squad for the RECEIVING team (id_team_to)");
    assert(/Transfer\.destroy\(\s*\{\s*where:\s*\{\s*id\s*\}\s*,\s*transaction/.test(fn),
        "soft-deletes the transfer inside the same transaction");
}

// ── Cron return path: loanCleanup ────────────────────────────────────────────
console.log(`${c.cyan}▶ Loan auto-return cron cleanup${c.reset}`);
{
    const src = read(BACKEND, "src", "Schedule", "loanCleanup.mjs");
    assert(src !== "", "loanCleanup.mjs exists");
    assert(/removeReceivingTeamParticipations/.test(src) && /LoanReturn\.mjs/.test(src),
        "imports the shared cleanup helper");
    assert(/DB\.transaction\(/.test(src), "returns each expired loan atomically in a transaction");
    assert(/id_team\s*:\s*loan\.id_team_from/.test(src),
        "still returns the player to id_team_from (original team) — unchanged");
    assert(!/id_team\s*:\s*(loan|transfer)\.id_team_to/.test(src),
        "does NOT send the player to id_team_to (guards the old cron bug)");
    assert(/removeReceivingTeamParticipations\(\s*loan\.id_player\s*,\s*loan\.id_team_to/.test(src),
        "clears the league squad for the RECEIVING team (loan.id_team_to)");
}

// ── Latent bug: paranoid-aware "latest transfer" subquery ────────────────────
console.log(`${c.cyan}▶ Players club-transfer/loan lists ignore soft-deleted transfers${c.reset}`);
{
    const src = read(BACKEND, "src", "Graphql", "Resolvers", "Players.mjs");
    assert(src !== "", "Players.mjs exists");
    const subqueries = src.match(/SELECT transfers\.id FROM transfers[\s\S]*?LIMIT 0, 1/g) || [];
    assert(subqueries.length >= 2, "both club-transfer and club-loan lists use the latest-transfer subquery");
    assert(subqueries.every((q) => /transfers\.deletedAt IS NULL/.test(q)),
        "every latest-transfer subquery excludes soft-deleted (returned) transfers");
}

// ── Backfill script ──────────────────────────────────────────────────────────
console.log(`${c.cyan}▶ Backfill cleanup script${c.reset}`);
{
    const src = read(BACKEND, "scripts", "cleanup-stuck-loan-participations.mjs");
    assert(src !== "", "cleanup-stuck-loan-participations.mjs exists");
    assert(/--apply/.test(src), "gates deletion behind an explicit --apply flag");
    assert(/DRY RUN/i.test(src), "defaults to a dry run");
    assert(/transition_type:\s*'loan'/.test(src) && /deletedAt:\s*\{\s*\[Op\.ne\]:\s*null\s*\}/.test(src),
        "identifies returned loans (soft-deleted 'loan' transfers)");
    assert(/mysqldump/.test(src), "takes a mysqldump backup before applying");
    assert(/ParticipatingPlayersMatch\.count/.test(src) && /ScorerMatch\.count/.test(src),
        "splits SAFE vs REVIEW by real match history");
    assert(/DB\.transaction\(/.test(src), "applies the SAFE deletions in a single transaction");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All loan-return league-cleanup guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} loan-return league-cleanup guard(s) failed.${c.reset}`);
    process.exit(1);
}
