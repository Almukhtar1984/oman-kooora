// اجتماع العميل 2026-11-16: تعليقات الرسائل بمستنداتها، وحسابات الأعضاء كل فريق وحده.
//
//   node tests/test-meeting-2026-11-16.mjs

import {
    attachmentProblem, commentNotice, commentProblem, commentRecipient, extensionOf,
} from "../src/Helpers/messageComments.mjs";
import { buildMemberAccounts, partyOf, CLUB_SOURCE } from "../src/Helpers/memberAccounts.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

// ── مستندات التعليق ─────────────────────────────────────────────────────
check("PDF يُقبل", attachmentProblem("بيان المستحقات.pdf"), null);
check("الامتداد بأي حالة أحرف", extensionOf("Letter.DocX"), "DOCX");
check("ملف تنفيذي يُرفض ويُسمّى", /«x.exe»/.test(attachmentProblem("x.exe") || ""), true);
check("ملف بلا امتداد يُرفض", Boolean(attachmentProblem("letter")), true);

// ── التعليق نفسه ─────────────────────────────────────────────────────────
check("تعليق مختار يمرّ", commentProblem({ content: "تم الاعتماد" }), null);
check("بلا تعليق يُرفض", commentProblem({ content: "  " }), "اختر التعليق");
check("تعليقٌ طويل يُوجَّه إلى الملاحظة", commentProblem({ content: "ا".repeat(300) }), "التعليق أطول من 255 حرفاً — ضع التفصيل في الملاحظة");

// ── من يُخبَر ────────────────────────────────────────────────────────────
const fromTeam = { id_team_sender: "t1", id_club_receiver: "c1" };
const fromClub = { id_club_sender: "c1", id_team_receiver: "t2" };
check("النادي يعلّق على رسالة فريق → يُخبَر الفريق", commentRecipient(fromTeam, { byClub: "c1" }), { id_team: "t1" });
check("النادي يعلّق على رسالته إلى فريق → يُخبَر الفريق", commentRecipient(fromClub, { byClub: "c1" }), { id_team: "t2" });
check("الفريق يعلّق على رسالة النادي → يُخبَر النادي", commentRecipient(fromClub, { byTeam: "t2" }), { id_club: "c1" });
check("بين فريقين → يُخبَر الفريق الآخر", commentRecipient({ id_team_sender: "t1", id_team_receiver: "t2" }, { byTeam: "t1" }), { id_team: "t2" });
check("لا أحد يُعرف → لا إشعار", commentRecipient(fromTeam, {}), null);
check("الإشعار يقول إن فيه مستنداً",
    commentNotice({ subject: "بيان المستحقات المالية", content: "تم الاعتماد", files: 1 }),
    "تعليق جديد على رسالة «بيان المستحقات المالية»: تم الاعتماد — مع مستند مرفق");
check("وبلا مستند لا يدّعيه", commentNotice({ subject: "س", content: "للعلم", files: 0 }), "تعليق جديد على رسالة «س»: للعلم");

// ── حسابات الأعضاء: كل فريق وحده، وحق الفريق غير حق النادي ──────────────
check("رسوم العضوية حقّ النادي", partyOf(CLUB_SOURCE), "club");
check("وما يسجّله الفريق حقّه", partyOf("حساب الفريق"), "team");

const accounts = buildMemberAccounts({
    year: 2026,
    members: [
        { id: "a1", name: "سالم", card_number: "111", team: "فريق النصر", subscription_date: null },
        { id: "a2", name: "خالد", card_number: "222", team: "فريق الجزيرة", subscription_date: null },
    ],
    payments: [
        { id: "p1", name: "سالم", card_number: "111", team: "فريق النصر", amount: 20, date: "2026-02-10", source: CLUB_SOURCE },
        { id: "p2", name: "سالم", card_number: "111", team: "فريق النصر", amount: 5, date: "2026-03-01", source: "حساب الفريق" },
        { id: "p3", name: "سالم", card_number: "111", team: "فريق الجزيرة", amount: 7, date: "2026-04-01", source: "حساب الفريق" },
        { id: "p4", name: "خالد", card_number: "222", team: "فريق الجزيرة", amount: 9, date: "2025-04-01", source: "حساب الفريق" },
    ],
});
const salem = accounts.rows.find((r) => r.card_number === "111");
check("للعضو: ما دفعه للفريق وما دفعه للنادي هذه السنة", [salem.paidToTeamThisYear, salem.paidToClubThisYear], [12, 20]);
const nasr = accounts.teams.find((t) => t.team === "فريق النصر");
const jazeera = accounts.teams.find((t) => t.team === "فريق الجزيرة");
check("فريق النصر وحده: عضو واحد، 5 للفريق، 20 للنادي", [nasr.members, nasr.teamThisYear, nasr.clubThisYear], [1, 5, 20]);
check("فريق الجزيرة وحده: دفعة سالم له فقط، ودفعة خالد من السنة الماضية لا تُحسب",
    [jazeera.members, jazeera.teamThisYear, jazeera.clubThisYear], [2, 7, 0]);
check("ومن سدّد في كل فريق", [nasr.paidMembers, jazeera.paidMembers], [1, 1]);
const direct = buildMemberAccounts({ year: 2026,
    members: [{ id: "c1", name: "عضو مباشر", card_number: "333", team: null }],
    payments: [{ id: "f", name: "عضو مباشر", card_number: "333", team: null, amount: 15, date: "2026-05-01", source: CLUB_SOURCE }] });
check("عضو النادي بلا فريق له سطره أولاً، ورسومه للنادي",
    direct.teams[0], { team: "", members: 1, paidMembers: 1, teamThisYear: 0, clubThisYear: 15 });
check("مجموع النادي: الفرق والنادي", [accounts.teamThisYear, accounts.clubThisYear, accounts.totalThisYear], [12, 20, 32]);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
