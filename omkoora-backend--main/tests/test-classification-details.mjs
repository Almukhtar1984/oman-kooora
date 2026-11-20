// تفاصيل التصنيف: المركز والفئة العمرية للاعب، والصفة للجهاز الفني، والمنصب لمجلس الإدارة.
//
//   node tests/test-classification-details.mjs

import {
    PLAYER_CLASSES, classificationDetails, classificationDetailsProblem,
} from "../src/Helpers/classificationDetails.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

// ─── اللاعب ───
check("لاعب بلا تفاصيل: الفئة والمركز معاً", classificationDetailsProblem("player", {}), "اختر الفئة العمرية ومركز اللاعب");
check("لاعب بلا مركز", classificationDetailsProblem("player", { class: "young" }), "اختر مركز اللاعب");
check("لاعب بلا فئة", classificationDetailsProblem("player", { player_center: "حارس" }), "اختر الفئة العمرية");
check("فئةٌ ليست في عمود players.class تُرفض", classificationDetailsProblem("player", { class: "under11", player_center: "وسط" }), "اختر الفئة العمرية");
check("مركزٌ من مسافات فقط كالفارغ", classificationDetailsProblem("player", { class: "young", player_center: "   " }), "اختر مركز اللاعب");
check("لاعب مكتمل", classificationDetailsProblem("player", { class: "firstDegree", player_center: "مهاجم" }), null);
check("كل فئات العمود مقبولة", PLAYER_CLASSES.map((c) => classificationDetailsProblem("player", { class: c, player_center: "دفاع" })), [null, null, null, null]);
check("مركزٌ أطول من العمود", classificationDetailsProblem("player", { class: "young", player_center: "م".repeat(51) }), "مركز اللاعب أطول من المسموح");

// ─── الجهاز الفني ومجلس الإدارة ───
check("جهاز فني بلا صفة", classificationDetailsProblem("technical", {}), "اختر الصفة في الجهاز الفني");
check("مجلس إدارة بلا منصب", classificationDetailsProblem("member", { classification: "" }), "اختر المنصب في مجلس الإدارة");
check("مجلس إدارة: نائب رئيس", classificationDetailsProblem("member", { classification: "نائب رئيس" }), null);
check("جهاز فني: مساعد مدرب", classificationDetailsProblem("technical", { classification: "مساعد مدرب" }), null);
check("صفةٌ أطول من العمود", classificationDetailsProblem("technical", { classification: "x".repeat(51) }), "الصفة أطول من المسموح");
check("نوعٌ غير معروف يُترك لمن بعده", classificationDetailsProblem("coach", {}), null);

// ─── ما يُكتب ───
check("اللاعب: الفئة والمركز منظّفين", classificationDetails("player", { class: " young ", player_center: " حارس ", classification: "x" }), { class: "young", player_center: "حارس" });
check("مجلس الإدارة: المنصب وحده", classificationDetails("member", { classification: " أمين الصندوق ", class: "young" }), { classification: "أمين الصندوق" });
check("الجهاز الفني: الصفة وحدها", classificationDetails("technical", { classification: "مدرب" }), { classification: "مدرب" });
check("لا قيم إنجليزية افتراضية بعد اليوم", JSON.stringify(classificationDetails("member", {})).includes("member"), false);

console.log(`\n${pass} نجح، ${fail} فشل`);
process.exit(fail ? 1 : 0);
