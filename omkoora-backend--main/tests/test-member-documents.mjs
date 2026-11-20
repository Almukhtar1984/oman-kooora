// «تسجيل عضو جديد»: الاستمارات مع الطلب (العميل، 2026-11-19).
// «استمارة طلب العضوية، وإذا كان أقل من 18 تعهد ولي الأمر — هذا بالنسبة لتسجيل العضوية».
//
//   node tests/test-member-documents.mjs

import {
    assemblyUpdateFields, documentsProblem, needsGuardian, GUARDIAN_AGE, MAX_EXTRA_ATTACHMENTS,
} from "../src/Helpers/memberRegistration.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

const today = new Date(2026, 10, 19);
const form = { filename: "form.pdf" };

// ── من يحتاج تعهد ولي الأمر ─────────────────────────────────────────────
check("السن 18", GUARDIAN_AGE, 18);
check("ابن 12 سنة يحتاجه", needsGuardian("2014-01-07", today), true);
check("ابن 17 سنة قبل يوم ميلاده الـ18 يحتاجه", needsGuardian("2008-11-20", today), true);
check("ابن 18 سنة في يوم ميلاده لا يحتاجه", needsGuardian("2008-11-19", today), false);
check("تاريخ لا يُقرأ لا يُلزم بشيء", needsGuardian("", today), false);

// ── ما ينقص الطلب ───────────────────────────────────────────────────────
check("بلا استمارة طلب العضوية لا يُرسل",
    documentsProblem({ date_birth: "1990-01-01" }, today), "أرفق: استمارة طلب العضوية");
check("البالغ مع الاستمارة يكتمل",
    documentsProblem({ date_birth: "1990-01-01", membership_form: form }, today), null);
check("القاصر بلا التعهد لا يُرسل",
    documentsProblem({ date_birth: "2014-01-07", membership_form: form }, today), "أرفق: تعهد ولي الأمر (العضو دون 18 سنة)");
check("القاصر بلا الاستمارتين: تُسمّيان معاً",
    documentsProblem({ date_birth: "2014-01-07" }, today), "أرفق: استمارة طلب العضوية، تعهد ولي الأمر (العضو دون 18 سنة)");
check("القاصر مع الاستمارتين يكتمل",
    documentsProblem({ date_birth: "2014-01-07", membership_form: form, guardian_form: form }, today), null);
check(`المرفقات الأخرى ${MAX_EXTRA_ATTACHMENTS} على الأكثر`,
    documentsProblem({ date_birth: "1990-01-01", membership_form: form, attachments: [1, 2, 3, 4, 5, 6] }, today),
    `المرفقات الأخرى ${MAX_EXTRA_ATTACHMENTS} ملفات على الأكثر`);
check("خمسة مرفقات تمرّ",
    documentsProblem({ date_birth: "1990-01-01", membership_form: form, attachments: [1, 2, 3, 4, 5] }, today), null);

// ── «تعديل» لا يمحو الملفات ─────────────────────────────────────────────
const fields = assemblyUpdateFields({
    first_name: "سالم", nationalID: null, nationalIDBack: null, personal_picture: null,
    membership_form: null, guardian_form: null, attachments: [], oldNationalID: "x.jpg",
    date_birth: "2014-01-07", membership_date: "Invalid Date", subscription_date: null,
});
check("الملفات التي لم تُرفق لا تُكتب null",
    ["nationalID", "nationalIDBack", "personal_picture", "membership_form", "guardian_form", "attachments", "oldNationalID"]
        .filter((key) => key in fields), []);
check("والتاريخ الذي لا يُقرأ لا يُكتب", "membership_date" in fields, false);
check("والتاريخ الصحيح والفارغ يُكتبان كما هما", [fields.date_birth, fields.subscription_date], ["2014-01-07", null]);
check("والاسم يُكتب", fields.first_name, "سالم");

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
