#!/usr/bin/env node
/**
 * Static guard for the resolvers that drive the "عرض لاعبين / جهاز فني"
 * modals in the league dashboard. These tests caught a regression where
 * the wrong column was used in the `where` clause and the modal silently
 * returned an empty list.
 *
 *   node tests/test-participating-resolvers.mjs
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

const src = readFileSync(
    resolve(__dirname, "..", "src", "Graphql", "Resolvers", "League.mjs"),
    "utf8"
);

console.log(`${c.cyan}▶ allParticipatingTechnicalStaff resolver${c.reset}`);

// Slice out the resolver body so the assertions are scoped — otherwise
// matches in unrelated resolvers would mask real regressions.
const sliceResolver = (name) => {
    const startIdx = src.indexOf(`${name}: async`);
    if (startIdx === -1) return "";
    // Naive but reliable: take ~40 lines after the opening — enough to
    // cover the body of any of these read-side resolvers.
    return src.slice(startIdx, startIdx + 1500);
};

const techBody = sliceResolver("allParticipatingTechnicalStaff");
assert(techBody !== "", "resolver exists in League.mjs");
assert(
    /ParticipatingTechnicalStaff\.findAll/.test(techBody),
    "uses ParticipatingTechnicalStaff.findAll"
);
assert(
    /id_participating_team\s*:\s*idParticipatingTeams/.test(techBody),
    "filters by id_participating_team (not id_team / id_participating_teams / typo)"
);

console.log(`${c.cyan}▶ allParticipatingPlayers resolver${c.reset}`);
const playersBody = sliceResolver("allParticipatingPlayers");
assert(playersBody !== "", "resolver exists in League.mjs");
assert(
    /ParticipatingPlayers\.findAll/.test(playersBody),
    "uses ParticipatingPlayers.findAll"
);
assert(
    /id_participating_team\s*:\s*idParticipatingTeams/.test(playersBody),
    "filters by id_participating_team"
);

console.log(`${c.cyan}▶ updateScorerMatch / updateParticipatingTechnicalStaff status return${c.reset}`);
// Regression: previously these returned `status: result[0] >= 1` where
// `result` was already a number — so status was always false.
const updateScorerBody  = sliceResolver("updateScorerMatch");
const updateStaffBody   = sliceResolver("updateParticipatingTechnicalStaff");
assert(
    !/status:\s*result\[0\]\s*>=\s*1/.test(updateScorerBody),
    "updateScorerMatch no longer returns status: result[0] >= 1 (number-index bug)"
);
assert(
    !/status:\s*result\[0\]\s*>=\s*1/.test(updateStaffBody),
    "updateParticipatingTechnicalStaff no longer returns status: result[0] >= 1"
);

console.log(`${c.cyan}▶ createArbitre is upsert${c.reset}`);
const createArbitreBody = sliceResolver("createArbitre");
assert(
    /findOne\(\s*\{\s*where:\s*\{\s*id_match\s*\}\s*\}\s*\)/.test(createArbitreBody),
    "createArbitre looks up an existing row by id_match before creating"
);

console.log(`${c.cyan}▶ deleteScorerMatch resolver exists${c.reset}`);
const deleteScorerBody = sliceResolver("deleteScorerMatch");
assert(deleteScorerBody !== "", "deleteScorerMatch resolver is registered");
assert(
    /ScorerMatch\.destroy\(\s*\{\s*where:\s*\{\s*id\s*\}\s*\}\s*\)/.test(deleteScorerBody),
    "deleteScorerMatch deletes by id"
);

// Also verify the schema declares it.
const schemaSrc = readFileSync(
    resolve(__dirname, "..", "src", "Graphql", "Schemas", "League.mjs"),
    "utf8"
);
assert(
    /deleteScorerMatch\s*\(\s*id:\s*ID!\s*\)\s*:\s*statusDelete/.test(schemaSrc),
    "schema declares deleteScorerMatch(id: ID!): statusDelete"
);

console.log(`${c.cyan}▶ createParticipatingTeams skips placeholder rows${c.reset}`);
const createTeamsBody = sliceResolver("createParticipatingTeams");
assert(
    /\.filter\(/.test(createTeamsBody) && /id_team/.test(createTeamsBody),
    "createParticipatingTeams filters rows missing id_team before bulkCreate"
);

console.log(`${c.cyan}▶ updateParticipatingTeams status return + placeholder skip${c.reset}`);
const updateTeamsBody = sliceResolver("updateParticipatingTeams");
assert(
    !/status:\s*result\[0\]\s*>=\s*1/.test(updateTeamsBody),
    "updateParticipatingTeams no longer returns status: result[0] >= 1"
);
assert(
    /isPlaceholder|continue/.test(updateTeamsBody),
    "updateParticipatingTeams skips placeholder rows instead of crashing the loop"
);

if (failures > 0) {
    console.log(`${c.red}\n${failures} check(s) failed.${c.reset}`);
    process.exit(1);
}
console.log(`${c.green}\nAll resolver guards passed.${c.reset}`);
