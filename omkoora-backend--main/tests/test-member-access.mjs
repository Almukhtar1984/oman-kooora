// مَن يلمس سجلّ العضوية: النادي أعضاءَ ناديه، والفريق أعضاءَ فريقه، ومدير النظام الكل.
//
//   node tests/test-member-access.mjs

import {
    clubBulkProblem, memberAccessProblem, memberCreateProblem, ownershipFieldsFor,
} from "../src/Helpers/memberAccess.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};
const code = (problem) => problem?.code ?? null;

const admin = { role: "1" };
const rustaq = { role: "2", idClub: "c-rustaq" };
const bahla = { role: "2", idClub: "c-bahla" };
const nasr = { role: "3", idClub: "c-rustaq", idTeam: "t-nasr" };
const jazeera = { role: "3", idClub: "c-rustaq", idTeam: "t-jazeera" };
const league = { role: "4" };
const official = { role: "5" };

// أعضاء كما في القاعدة: من أضافه النادي (id_club وحده)، ومن سجّله فريق مع ناديه،
// ومن سجّله فريقٌ قديماً بلا id_club (314 سجلاً على الخادم).
const clubOnly = { id_club: "c-rustaq", id_team: null };
const viaTeam = { id_club: "c-rustaq", id_team: "t-nasr" };
const oldTeamRow = { id_club: null, id_team: "t-nasr", teamClub: "c-rustaq" };

// ── التعديل والحذف ──────────────────────────────────────────────────────
check("مدير النظام يعدّل أي عضو", code(memberAccessProblem(admin, clubOnly)), null);
check("النادي يعدّل عضواً أضافه", code(memberAccessProblem(rustaq, clubOnly)), null);
check("النادي يعدّل عضواً سجّله فريقٌ من فرقه", code(memberAccessProblem(rustaq, viaTeam)), null);
check("والسجل القديم بلا نادٍ: ناديه نادي فريقه", code(memberAccessProblem(rustaq, oldTeamRow)), null);
check("نادٍ آخر لا يعدّله", memberAccessProblem(bahla, viaTeam), { code: "FORBIDDEN_MEMBER", message: "هذا العضو لا يتبع ناديك" });
check("ولا السجل القديم لنادٍ آخر", code(memberAccessProblem(bahla, oldTeamRow)), "FORBIDDEN_MEMBER");
check("الفريق يعدّل عضو فريقه", code(memberAccessProblem(nasr, viaTeam)), null);
check("وسجلّه القديم", code(memberAccessProblem(nasr, oldTeamRow)), null);
check("فريقٌ آخر في النادي نفسه لا يعدّله", memberAccessProblem(jazeera, viaTeam), { code: "FORBIDDEN_MEMBER", message: "هذا العضو ليس في فريقك" });
check("ولا عضواً أضافه النادي بلا فريق", code(memberAccessProblem(nasr, clubOnly)), "FORBIDDEN_MEMBER");
check("حساب الدوري لا يعدّل العضوية", code(memberAccessProblem(league, viaTeam)), "FORBIDDEN_ROLE");
check("ولا حكم المباراة", code(memberAccessProblem(official, viaTeam)), "FORBIDDEN_ROLE");
check("حساب نادٍ بلا نادٍ معروف لا يعدّل شيئاً", code(memberAccessProblem({ role: "2", idClub: null }, clubOnly)), "FORBIDDEN_MEMBER");
check("عضو غير موجود", code(memberAccessProblem(rustaq, null)), "MEMBER_NOT_FOUND");
check("وسجلٌّ بلا نادٍ ولا فريق: لمدير النظام وحده",
    [code(memberAccessProblem(rustaq, { id_club: null, id_team: null })), code(memberAccessProblem(admin, { id_club: null, id_team: null }))],
    ["FORBIDDEN_MEMBER", null]);

// ── الإنشاء ─────────────────────────────────────────────────────────────
check("النادي يسجّل في ناديه", code(memberCreateProblem(rustaq, { id_club: "c-rustaq" })), null);
check("ولا يسجّل في نادٍ آخر", code(memberCreateProblem(rustaq, { id_club: "c-bahla" })), "FORBIDDEN_MEMBER");
check("ولا في فريق نادٍ آخر", code(memberCreateProblem(rustaq, { id_team: "t-x", teamClub: "c-bahla" })), "FORBIDDEN_MEMBER");
check("والفريق في فريقه", code(memberCreateProblem(nasr, { id_team: "t-nasr" })), null);
check("ولا في فريقٍ آخر", code(memberCreateProblem(nasr, { id_team: "t-jazeera" })), "FORBIDDEN_MEMBER");
check("ولا في نادٍ آخر", code(memberCreateProblem(nasr, { id_team: "t-nasr", id_club: "c-bahla" })), "FORBIDDEN_MEMBER");
check("حساب فريق بلا فريق معروف لا يسجّل", code(memberCreateProblem({ role: "3", idTeam: null }, {})), "FORBIDDEN_MEMBER");
check("الدوري لا يسجّل أعضاء", code(memberCreateProblem(league, { id_club: "c-rustaq" })), "FORBIDDEN_ROLE");
check("مدير النظام يسجّل حيث شاء", code(memberCreateProblem(admin, { id_club: "c-bahla" })), null);

// ── الإضافة الجماعية ───────────────────────────────────────────────────
check("النادي يضيف أهل ناديه", code(clubBulkProblem(rustaq, "c-rustaq")), null);
check("ولا يضيف أهل نادٍ آخر", code(clubBulkProblem(rustaq, "c-bahla")), "FORBIDDEN_MEMBER");
check("والفريق لا يملكها", code(clubBulkProblem(nasr, "c-rustaq")), "FORBIDDEN_ROLE");

// ── التعديل لا ينقل العضو ───────────────────────────────────────────────
check("النادي والفريق لا يغيّران نادي العضو ولا فريقه بالتعديل",
    [ownershipFieldsFor(rustaq, { first_name: "س", id_club: "c-bahla", id_team: "t-x" }),
     ownershipFieldsFor(nasr, { phone: "9", id_team: "t-jazeera" })],
    [{ first_name: "س" }, { phone: "9" }]);
check("ومدير النظام يغيّرهما", ownershipFieldsFor(admin, { id_team: "t-x" }), { id_team: "t-x" });

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
