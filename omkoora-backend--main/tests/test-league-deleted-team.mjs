// فريقٌ حُذف بعد مشاركته في دورة يبقى في سجلّها باسمه، ولا يرجع فارغاً:
// رجوعه فارغاً أسقط صفحة «المسابقات» عند كل فريقٍ شاركه الدورة (نوفمبر 2026).
//
//   node tests/test-league-deleted-team.mjs

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const src = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/Graphql/Resolvers/League.mjs"), "utf8");
let pass = 0, fail = 0;
const check = (label, ok) => {
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label}`); }
};

const typeBlock = src.slice(src.indexOf("    ParticipatingTeams: {"), src.indexOf("    Match: {"));
check("ParticipatingTeams.team يقرأ الفريق المحذوف أيضاً",
    /team: async[\s\S]*?Team\.findByPk\(id_team, \{ paranoid: false \}\)/.test(typeBlock));
check("لا findByPk للفريق في الدورة يُسقط المحذوف", !/Team\.findByPk\(team\??\.id_team\)/.test(src));
check("إحصاء البطاقات يحمل اسم الفريق المحذوف", (src.match(/Team\.findByPk\(team\.id_team, \{ paranoid: false \}\)/g) || []).length >= 3);

console.log(`\n${pass} نجح، ${fail} فشل`);
process.exit(fail ? 1 : 0);
