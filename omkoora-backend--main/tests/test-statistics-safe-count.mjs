#!/usr/bin/env node
/**
 * Regression test for the statistics outage.
 *
 * A deployment whose DB is missing a newer model's table (DB_SYNC off — the
 * production `events` table) made SearchData/FetchAllData fail completely:
 *   Table 'tomoh.events' doesn't exist  ->  "Failed to fetch all data"
 * and the mobile app's statistics screen died on it. A total that cannot be
 * read must degrade to 0, never take the payload down.
 *
 * Pure unit check — no server, no DB (the models are stubbed).
 *
 *   node tests/test-statistics-safe-count.mjs
 */
import { safeCount } from "../src/Graphql/Resolvers/Stat.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};

// A table that does not exist: exactly what Sequelize throws on production.
const missingTable = {
    count: async () => {
        const err = new Error("Table 'tomoh.events' doesn't exist");
        err.name = "SequelizeDatabaseError";
        err.parent = { code: "ER_NO_SUCH_TABLE", sqlMessage: "Table 'tomoh.events' doesn't exist" };
        throw err;
    },
};
const workingTable = { count: async (options) => (options?.where ? 3 : 7) };

const run = async () => {
    assert((await safeCount(missingTable, undefined, "events")) === 0, "a missing table counts as 0 instead of throwing");
    assert((await safeCount(workingTable, undefined, "teams")) === 7, "a working table returns its count");
    assert((await safeCount(workingTable, { where: { x: 1 } }, "loans")) === 3, "options are passed through to count()");

    // The whole set of totals must survive one broken model.
    const totals = await Promise.all([
        safeCount(workingTable, undefined, "teams"),
        safeCount(missingTable, undefined, "events"),
        safeCount(workingTable, undefined, "clubs"),
    ]);
    assert(totals.join(",") === "7,0,7", "one broken total does not fail the others");

    console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
    process.exit(failures === 0 ? 0 : 1);
};
run();
