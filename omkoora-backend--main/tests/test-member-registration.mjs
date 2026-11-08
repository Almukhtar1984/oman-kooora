// «تسجيل عضو جديد» وحسابات الأعضاء في النادي (العميل، 2026-11-08).
//
//   node tests/test-member-registration.mjs

import { classifyProblem, isAdmitted, normalizeCardNumber, registrationProblem } from "../src/Helpers/memberRegistration.mjs";
import { buildMemberAccounts, countsAsPaid } from "../src/Helpers/memberAccounts.mjs";
import {
    APPROVED, CANCELLED, CLUB_PROCESSING, REJECTED_FINAL, SUBMITTED,
    legacyStatusFor, outcomeOf, requestTypeInfo,
} from "../src/Helpers/requestFlow.mjs";
import { feeLabel, feeTypeFor, isFeeType, priceLabel } from "../src/Helpers/clubFees.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

// ── التسجيل ──────────────────────────────────────────────────────────────
const full = { first_name: "سالم", second_name: "خالد", tribe: "العبري", card_number: "12345678", phone: "99123456", date_birth: "2000-01-01" };
check("طلب مكتمل يمرّ", registrationProblem(full), null);
check("ينقصه الاسم الأول والقبيلة — ويُسمّيان", registrationProblem({ ...full, first_name: "", tribe: " " }), "أكمل: الاسم الأول، القبيلة");
check("رقم مدني من حروف يُرفض", registrationProblem({ ...full, card_number: "12ab" }), "الرقم المدني أرقامٌ من 6 إلى 12 خانة");
check("الأرقام العربية تُقبل", registrationProblem({ ...full, card_number: "١٢٣٤٥٦٧٨" }), null);
check("وتُخزَّن لاتينية", normalizeCardNumber(" ١٢٣ ٤٥٦٧٨ "), "12345678");
check("هاتف قصير يُرفض", registrationProblem({ ...full, phone: "123" }), "رقم الهاتف غير صالح");

// ── على الطريق ───────────────────────────────────────────────────────────
check("نوع الطلب معروف، ويخصّ العضوية", requestTypeInfo("member_registration")?.entity, "assembly");
check("ورسومه رسوم العضوية السنوية", feeTypeFor("member_registration"), "member_registration");
check("نوع رسوم معروف", isFeeType("member_registration"), true);
check("اسمه في قائمة الأسعار", priceLabel("member_registration"), "رسوم العضوية السنوية");
check("واسمه في المطالبة", feeLabel("member_registration"), "رسوم العضوية");
check("مقدم من الفريق = بانتظار النادي في سجلّ العضوية", legacyStatusFor("assembly", SUBMITTED), "waiting_club");
check("مقبول مبدئياً ما زال بانتظار النادي", legacyStatusFor("assembly", CLUB_PROCESSING), "waiting_club");
check("الاعتماد النهائي = معتمد", legacyStatusFor("assembly", APPROVED), "accepted");
check("الرفض النهائي = مرفوض", legacyStatusFor("assembly", REJECTED_FINAL), "rejected");
check("الاعتماد يبدأ العضوية", outcomeOf("assembly", APPROVED), "admit_member");
check("والإلغاء لا أثر له غير الحالة", outcomeOf("assembly", CANCELLED), null);

// ── التصنيف بعد الاعتماد ─────────────────────────────────────────────────
const admitted = { status: "accepted", id_team: "t1" };
check("عضو قديم بلا حالة معتمد", isAdmitted({ status: null }), true);
check("من ينتظر النادي لم يُعتمد", isAdmitted({ status: "waiting_club" }), false);
check("معتمد يُصنَّف لاعباً", classifyProblem(admitted, "player", {}), null);
check("ينتظر النادي — لا تصنيف بعد",
    classifyProblem({ status: "waiting_club", id_team: "t1" }, "player", {}), "العضوية بانتظار اعتماد النادي — يُختار التصنيف بعد الاعتماد");
check("مرفوض — لا تصنيف", classifyProblem({ status: "rejected", id_team: "t1" }, "member", {}), "رفض النادي هذه العضوية، فلا تصنيف لها");
check("لاعب في فريق آخر — ذلك انتقال",
    classifyProblem(admitted, "player", { player: { sameTeam: false, teamName: "فريق الشباب" } }), "مسجّل لاعباً في فريق الشباب — ضمّه بطلب انتقال");
check("لاعب في الفريق نفسه بالفعل",
    classifyProblem(admitted, "player", { player: { sameTeam: true } }), "مسجّل لاعباً في هذا الفريق بالفعل");
check("لاعبٌ يُضاف إلى الجهاز الفني — صفتان لشخص واحد", classifyProblem(admitted, "technical", { player: { sameTeam: true } }), null);
check("تصنيف غير معروف", classifyProblem(admitted, "coach", {}), "تصنيف غير معروف");

// ── حسابات الأعضاء في النادي ─────────────────────────────────────────────
check("دفعة معلّقة لا تُحسب", [countsAsPaid("pending"), countsAsPaid("unpaid"), countsAsPaid(null), countsAsPaid("paid")], [false, false, true, true]);

const accounts = buildMemberAccounts({
    year: 2026,
    members: [
        { id: "a1", name: "سالم العبري", card_number: "111", membership_number: "M-7", team: "فريق النصر", subscription_date: "2025-03-01" },
        { id: "a2", name: "خالد الهنائي", card_number: "222", membership_number: null, team: "فريق النصر", subscription_date: null },
    ],
    payments: [
        { id: "p1", name: "سالم العبري", card_number: "111", team: "فريق النصر", kind: "عضو", amount: 20, date: "2026-02-10", status: "paid", source: "رسوم العضوية السنوية" },
        { id: "p2", name: "سالم العبري", card_number: "111", team: "فريق النصر", kind: "لاعب", amount: 5, date: "2025-06-01", source: "حساب الفريق" },
        { id: "p3", name: "ناصر", card_number: "333", team: "فريق الجزيرة", kind: "مجلس إدارة", amount: 10, date: "2026-01-05", status: "pending" },
        { id: "p4", name: "بلا رقم", card_number: "", team: "فريق الجزيرة", kind: "لاعب", amount: 3, date: "2026-04-01" },
    ],
});
const salem = accounts.rows.find((r) => r.card_number === "111");
check("الشخص مرة واحدة مهما تعدّدت صفاته", accounts.rows.filter((r) => r.card_number === "111").length, 1);
check("وصفاته معاً", salem.kinds.sort(), ["عضو", "لاعب"].sort());
check("مدفوع السنة يحسب دفعات السنة وحدها", salem.paidThisYear, 20);
check("والإجمالي كل الدفعات", salem.totalPaid, 25);
check("آخر دفعة الأحدث", salem.lastPaymentDate, "2026-02-10");
check("ورقم عضويته معه", salem.membership_number, "M-7");
check("عضو بلا دفعة يظهر — ولم يسدّد سنته", accounts.rows.find((r) => r.card_number === "222")?.subscribedThisYear, false);
check("دفعة معلّقة لا تُدخل صاحبها القائمة", accounts.rows.some((r) => r.card_number === "333"), false);
check("سجلٌّ بلا رقم مدني يبقى وحده لا يندمج", accounts.rows.filter((r) => r.name === "بلا رقم").length, 1);
check("المجموع والعدّ", [accounts.totalThisYear, accounts.members, accounts.paidMembers], [23, 3, 2]);
check("تاريخ الدفعة كائناً من قاعدة البيانات يُقرأ يومه — رسوم العضوية المعتمدة",
    buildMemberAccounts({ year: 2026, payments: [{ id: "f", name: "س", card_number: "5", amount: 15, date: new Date("2026-11-08T15:52:05Z") }] }).rows[0].paidThisYear, 15);
check("اشتراكٌ مسجَّل لهذه السنة يكفي بلا دفعة",
    buildMemberAccounts({ year: 2026, members: [{ id: "x", name: "س", card_number: "9", subscription_date: "2026-05-01" }] }).rows[0].subscribedThisYear, true);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
