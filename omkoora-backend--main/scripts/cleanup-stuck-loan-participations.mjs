#!/usr/bin/env node
/**
 * ONE-OFF, idempotent, dry-run-first cleanup for players left stuck in a
 * receiving team's LEAGUE squad by loans that were returned BEFORE the loan
 * return fix shipped (BackToOldTeamTransfer / loanCleanup now clear these
 * automatically; this script backfills the historical mess).
 *
 * A ParticipatingPlayers row `pp` is a CANDIDATE only when ALL hold:
 *   1. pp.id_participating_team -> participating_teams pt -> pt.id_team = T.
 *   2. The player's CURRENT players.id_team != T (he no longer belongs to T).
 *   3. There EXISTS a transfer with id_player = pp.id_player, id_team_to = T,
 *      transition_type = 'loan' AND deletedAt IS NOT NULL (a RETURNED loan
 *      into T — a soft-deleted 'loan' row, since Transfer is paranoid).
 *
 * Candidates are split:
 *   - SAFE (phantom): NO ParticipatingPlayersMatch and NO ScorerMatch reference
 *     pp.id -> the player never actually played for T in the league -> deletable.
 *   - REVIEW: has match participation / scorer records -> printed for manual
 *     decision, NEVER auto-deleted (deleting would risk real match history).
 *
 * Usage (run with the PRODUCTION env loaded, e.g. from the deployed api dir so
 * dotenv picks up its .env):
 *
 *   # DRY RUN (default) — changes nothing, prints the report:
 *   NODE_ENV=production node scripts/cleanup-stuck-loan-participations.mjs
 *
 *   # APPLY — mysqldump backup first, then soft-delete the SAFE set in one txn:
 *   NODE_ENV=production node scripts/cleanup-stuck-loan-participations.mjs --apply
 *
 * Idempotent: ParticipatingPlayers is paranoid, so deletions are soft; a second
 * run no longer sees the cleaned rows and finds nothing.
 */

import { Op } from 'sequelize';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import DB from '../src/Config/DBContact.mjs';
import {
    Transfer,
    ParticipatingTeams,
    ParticipatingPlayers,
    Players,
    Person,
    Team,
    League,
    ScorerMatch,
    ParticipatingPlayersMatch,
} from '../src/Models/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

const c = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m', yellow: '\x1b[33m', dim: '\x1b[2m' };
const uniq = (arr) => [...new Set(arr.filter((v) => v !== null && v !== undefined))];

function printRows(title, rows, color) {
    console.log(`\n${color}${title} (${rows.length})${c.reset}`);
    if (rows.length === 0) {
        console.log(`${c.dim}  — none —${c.reset}`);
        return;
    }
    console.log(
        `${c.dim}  ${'player'.padEnd(28)} ${'league'.padEnd(24)} ${'receiving team'.padEnd(22)} ${'#matches'.padEnd(8)} pp.id${c.reset}`
    );
    for (const r of rows) {
        console.log(
            `  ${String(r.playerName).padEnd(28)} ${String(r.leagueName).padEnd(24)} ${String(r.teamName).padEnd(22)} ${String(r.matches).padEnd(8)} ${r.ppId}`
        );
    }
}

function backupAffectedTables() {
    const host = process.env.DB_PRO_HOST || 'localhost';
    const user = process.env.DB_PRO_USERNAME;
    const password = process.env.DB_PRO_PASSWORD;
    const database = process.env.DB_PRO_DATABASE;

    // Resolve the REAL table names from the models so the dump is exact
    // regardless of Sequelize pluralisation.
    const tables = uniq([
        ParticipatingPlayers.getTableName(),
        ParticipatingPlayersMatch.getTableName(),
        ScorerMatch.getTableName(),
    ]).map((t) => (typeof t === 'string' ? t : t.tableName));

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = resolve(__dirname, '..', 'backups');
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, `loan-cleanup-backup-${stamp}.sql`);

    const args = ['-h', host, '-u', user, database, ...tables];
    const dump = execFileSync('mysqldump', args, {
        env: { ...process.env, MYSQL_PWD: password },
        maxBuffer: 1024 * 1024 * 1024,
    });
    writeFileSync(file, dump);
    console.log(`${c.green}✓${c.reset} Backup written: ${file} (tables: ${tables.join(', ')})`);
    return file;
}

async function main() {
    console.log(`${c.cyan}▶ Stuck loan-participation cleanup — ${APPLY ? 'APPLY' : 'DRY RUN'}${c.reset}`);

    // 1) Returned loans → the (player, receiving team) pairs that ever happened,
    //    and the set of receiving teams to scope everything else to.
    const returnedLoans = await Transfer.findAll({
        where: { transition_type: 'loan', deletedAt: { [Op.ne]: null } },
        attributes: ['id_player', 'id_team_to'],
        paranoid: false,
    });
    const returnedPairs = new Set();
    const receivingTeamIds = new Set();
    for (const l of returnedLoans) {
        if (!l.id_player || !l.id_team_to) continue;
        returnedPairs.add(`${l.id_player}::${l.id_team_to}`);
        receivingTeamIds.add(l.id_team_to);
    }
    console.log(`  returned loans: ${returnedLoans.length}, receiving teams: ${receivingTeamIds.size}`);

    if (receivingTeamIds.size === 0) {
        console.log(`${c.green}Nothing to do — no returned loans found.${c.reset}`);
        return { safe: [], review: [] };
    }

    // 2) Participations (league enrolments) of those receiving teams.
    const participations = await ParticipatingTeams.findAll({
        where: { id_team: { [Op.in]: [...receivingTeamIds] } },
        attributes: ['id', 'id_team', 'id_league'],
    });
    const ptById = new Map(participations.map((pt) => [pt.id, { team: pt.id_team, league: pt.id_league }]));
    const ptIds = participations.map((pt) => pt.id);
    if (ptIds.length === 0) {
        console.log(`${c.green}Nothing to do — receiving teams have no league participations.${c.reset}`);
        return { safe: [], review: [] };
    }

    // 3) Active (non-soft-deleted) enrolments in those participations.
    const enrolments = await ParticipatingPlayers.findAll({
        where: { id_participating_team: { [Op.in]: ptIds } },
        attributes: ['id', 'id_player', 'id_participating_team'],
    });

    // 4) Current team of each enrolled player.
    const playerIds = uniq(enrolments.map((e) => e.id_player));
    const players = playerIds.length
        ? await Players.findAll({ where: { id: { [Op.in]: playerIds } }, attributes: ['id', 'id_team', 'id_person'] })
        : [];
    const playerById = new Map(players.map((p) => [p.id, p]));

    // Filter to conservative candidates (all three conditions).
    const candidates = [];
    for (const e of enrolments) {
        const pt = ptById.get(e.id_participating_team);
        if (!pt) continue;
        const T = pt.team;
        const player = playerById.get(e.id_player);
        if (!player) continue; // orphan enrolment — out of scope
        if (player.id_team === T) continue; // condition 2: still on the team → legit
        if (!returnedPairs.has(`${e.id_player}::${T}`)) continue; // condition 3: no returned loan into T
        candidates.push({ ppId: e.id, idPlayer: e.id_player, team: T, league: pt.league, idPerson: player.id_person });
    }

    // 5) Split SAFE vs REVIEW by real match history. Count with paranoid:false
    //    so even soft-deleted match rows push a candidate to REVIEW (protect).
    for (const cand of candidates) {
        const [ppm, sm] = await Promise.all([
            ParticipatingPlayersMatch.count({ where: { id_participating_player: cand.ppId }, paranoid: false }),
            ScorerMatch.count({ where: { id_participating_player: cand.ppId }, paranoid: false }),
        ]);
        cand.matches = ppm + sm;
        cand.safe = cand.matches === 0;
    }

    // Display names.
    const teams = await Team.findAll({ where: { id: { [Op.in]: uniq(candidates.map((c) => c.team)) } }, attributes: ['id', 'name'] });
    const teamName = new Map(teams.map((t) => [t.id, t.name]));
    const leagues = await League.findAll({ where: { id: { [Op.in]: uniq(candidates.map((c) => c.league)) } }, attributes: ['id', 'name'] });
    const leagueName = new Map(leagues.map((l) => [l.id, l.name]));
    const persons = await Person.findAll({
        where: { id: { [Op.in]: uniq(candidates.map((c) => c.idPerson)) } },
        attributes: ['id', 'first_name', 'second_name', 'third_name'],
    });
    const personName = new Map(persons.map((p) => [p.id, [p.first_name, p.second_name, p.third_name].filter(Boolean).join(' ')]));

    const decorate = (cand) => ({
        ...cand,
        playerName: personName.get(cand.idPerson) || cand.idPlayer,
        teamName: teamName.get(cand.team) || cand.team,
        leagueName: leagueName.get(cand.league) || cand.league || '(no league)',
    });

    const safe = candidates.filter((c) => c.safe).map(decorate);
    const review = candidates.filter((c) => !c.safe).map(decorate);

    printRows('SAFE — phantom enrolments (deletable)', safe, c.green);
    printRows('REVIEW — has match history (manual decision, NOT auto-deleted)', review, c.yellow);

    console.log(`\n${c.cyan}Summary:${c.reset} candidates=${candidates.length}  safe=${safe.length}  review=${review.length}`);

    if (!APPLY) {
        console.log(`\n${c.dim}DRY RUN — nothing changed. Re-run with --apply to delete the SAFE set.${c.reset}`);
        return { safe, review };
    }

    if (safe.length === 0) {
        console.log(`\n${c.green}Nothing to apply — SAFE set is empty.${c.reset}`);
        return { safe, review };
    }

    // --apply: backup first, then soft-delete the SAFE set atomically.
    backupAffectedTables();

    const ids = safe.map((c) => c.ppId);
    await DB.transaction(async (t) => {
        const removed = await ParticipatingPlayers.destroy({ where: { id: { [Op.in]: ids } }, transaction: t });
        console.log(`${c.green}✓${c.reset} Soft-deleted ${removed} phantom enrolment(s).`);
    });
    for (const id of ids) console.log(`  removed participating_player.id = ${id}`);

    return { safe, review };
}

main()
    .then(() => DB.close())
    .then(() => process.exit(0))
    .catch(async (err) => {
        console.error(`${c.red}Cleanup failed:${c.reset}`, err);
        try { await DB.close(); } catch { /* ignore */ }
        process.exit(1);
    });
