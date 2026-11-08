// مدة تسجيل الفريق: بعد آخر يوم يتوقف حسابه حتى يجدّده النادي (العميل، 2026-11-08).
//
//   node tests/test-team-registration.mjs

import {
    activationProblem, dayOf, isRegistrationOver, normalizePeriod, omanToday, periodProblem, teamSuspension,
} from "../src/Helpers/teamRegistration.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

const TODAY = "2026-11-08";

// ── اليوم في عُمان، لا في ساعة الخادم ─────────────────────────────────────
check("21:00 UTC يوم 8 هي الأولى صباح يوم 9 في مسقط", omanToday(new Date("2026-11-08T21:00:00Z")), "2026-11-09");
check("19:59 UTC يوم 8 ما زالت يوم 8 في مسقط", omanToday(new Date("2026-11-08T19:59:00Z")), "2026-11-08");

// ── متى تنتهي المدة ──────────────────────────────────────────────────────
check("آخر يوم ما زال ضمن المدة", isRegistrationOver("2026-11-08", TODAY), false);
check("اليوم التالي لآخر يوم: انتهت", isRegistrationOver("2026-11-07", TODAY), true);
check("بلا تاريخ نهاية لا تنتهي أبداً", isRegistrationOver(null, TODAY), false);
check("قيمة فارغة لا تُعدّ تاريخاً", isRegistrationOver("", TODAY), false);
check("تاريخ بوقت يُقرأ يومه", isRegistrationOver("2026-11-07 00:00:00", TODAY), true);

// ── ما يقبله النادي عند الإضافة ─────────────────────────────────────────
check("مدة سليمة", periodProblem({ start: "2026-11-08", end: "2027-11-07" }, TODAY), null);
check("بلا تواريخ: مقبول (فرق قائمة)", periodProblem({}, TODAY), null);
check("النهاية قبل البداية تُرفض", periodProblem({ start: "2026-12-01", end: "2026-11-30" }, TODAY), "تاريخ نهاية التسجيل قبل بدايته");
check("نهاية مضت تُرفض — كان الفريق سيتوقف لحظة إنشائه",
    periodProblem({ start: "2026-01-01", end: "2026-11-07" }, TODAY), "تاريخ نهاية التسجيل مضى — اختر تاريخاً قادماً");
check("وتمرّ حين تُرسل كما هي مع تعديل حقل آخر",
    periodProblem({ start: "2026-01-01", end: "2026-11-07" }, TODAY, { allowPastEnd: true }), null);
check("تاريخ غير صالح يُرفض", periodProblem({ end: "غداً" }, TODAY), "تاريخ نهاية التسجيل غير صالح");

check("التفريغ يصير null، والتاريخ يبقى يومه",
    normalizePeriod({ registration_start: "", registration_end: "2027-01-01T00:00:00.000Z", name: "x" }),
    { registration_start: null, registration_end: "2027-01-01", name: "x" });
check("dayOf لا يخترع تاريخاً", dayOf("لا شيء"), null);

// ── من يُمنع من الدخول ───────────────────────────────────────────────────
check("فريق مفعّل ضمن مدته يدخل", teamSuspension({ account_status: true, registration_end: "2026-12-31" }, TODAY), null);
check("فريق بلا مدة يدخل", teamSuspension({ account_status: true, registration_end: null }, TODAY), null);
check("انتهت مدته: يُمنع ولو بقي الحساب «مفعّلاً» حتى يمرّ عمل الليل",
    teamSuspension({ account_status: true, registration_end: "2026-11-07" }, TODAY)?.code, "TEAM_REGISTRATION_ENDED");
check("والرسالة تذكر التاريخ ومن يرفع التوقيف",
    /2026-11-07.*النادي/.test(teamSuspension({ account_status: false, registration_end: "2026-11-07" }, TODAY)?.message), true);
check("أوقفه النادي يدوياً: يُمنع", teamSuspension({ account_status: false, registration_end: null }, TODAY)?.code, "TEAM_SUSPENDED");
check("قيمة 0 من قاعدة البيانات = موقوف", teamSuspension({ account_status: 0 }, TODAY)?.code, "TEAM_SUSPENDED");
check("حساب ليس لفريق لا يُمنع", teamSuspension(null, TODAY), null);

// ── إعادة التفعيل ────────────────────────────────────────────────────────
const expired = { account_status: false, registration_end: "2026-11-07" };
check("تفعيل فريق انتهت مدته بلا تاريخ جديد يُرفض",
    Boolean(activationProblem(expired, { account_status: true }, TODAY)), true);
check("ومع تاريخ نهاية جديد قادم يمرّ",
    activationProblem(expired, { account_status: true, registration_end: "2027-11-07" }, TODAY), null);
check("ومع إزالة تاريخ النهاية يمرّ (بلا مدة)",
    activationProblem(expired, { account_status: true, registration_end: null }, TODAY), null);
check("التوقيف لا يحتاج تاريخاً", activationProblem(expired, { account_status: false }, TODAY), null);
check("تفعيل فريق ضمن مدته يمرّ",
    activationProblem({ account_status: false, registration_end: "2026-12-01" }, { account_status: true }, TODAY), null);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
