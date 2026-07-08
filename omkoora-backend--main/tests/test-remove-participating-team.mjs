#!/usr/bin/env node
/**
 * Guards the "delete team from the tournament" action added to the organiser's
 * edit-teams modal (sports-course UpdateParticipating). Each team row gets a
 * trash button: an existing participating team is deleted via
 * deleteParticipatingTeams; an empty placeholder row is just dropped locally.
 *
 *   node tests/test-remove-participating-team.mjs
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m" };
const ok  = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);
let failures = 0;
const assert = (cond, msg) => { if (cond) ok(msg); else { bad(msg); failures++; } };

const root = resolve(__dirname, "..", "..");
const src = (() => {
    try { return readFileSync(resolve(root, "client", "sports-course", "src", "components", "Modals", "UpdateParticipating.tsx"), "utf8"); }
    catch { return ""; }
})();

console.log(`${c.cyan}▶ Edit-teams modal can remove a team${c.reset}`);
assert(src !== "", "UpdateParticipating.tsx exists");
assert(/useDeleteParticipatingTeams/.test(src), "imports the delete-team mutation hook");
assert(/removeListItem/.test(src), "uses the form's removeListItem to drop the row");

console.log(`${c.cyan}▶ Delete handler${c.reset}`);
{
    const start = src.indexOf("handleRemoveTeam");
    const body = src.slice(start, start + 900);
    assert(start !== -1, "handleRemoveTeam exists");
    assert(/!item\?\.id/.test(body) && /removeListItem\("teams", index\)/.test(body),
        "an empty placeholder row is removed locally (no mutation)");
    assert(/window\.confirm/.test(body), "confirms before deleting an existing team");
    assert(/deleteParticipatingTeam\(\{[\s\S]*variables:\s*\{\s*id:\s*item\.id\s*\}/.test(body),
        "deletes the participating team by its id");
    assert(/refetchQueries:\s*\[AllLeagues\]/.test(body), "refreshes the leagues after delete");
    assert(/res\?\.deleteParticipatingTeams\?\.status/.test(body), "only drops the row when the delete succeeded");
    assert(/notyf\.success/.test(body), "shows a success toast");
}

console.log(`${c.cyan}▶ Every team row has a trash button${c.reset}`);
{
    assert(/IconTrash/.test(src), "renders a trash icon");
    assert(/onClick=\{\(\) => handleRemoveTeam\(index, item\)\}/.test(src), "row button calls handleRemoveTeam");
    assert(/حذف الفريق من الدورة/.test(src), "labels the action clearly");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All remove-participating-team guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} remove-participating-team guard(s) failed.${c.reset}`);
    process.exit(1);
}
