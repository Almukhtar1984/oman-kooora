// النشاط الواحد اسم واحد — مهما كُتب.
//
// العميل رأى في الإحصاء «كرة القدم» مرتين لأن فريقاً كتبها بلا ألف ولام وآخر
// كتب FOOTBAL. القائمة تمنع ذلك من الآن، وهذه الدالة تصلح ما كُتب قبلها.

import {
    ACTIVITIES, UNSPECIFIED, canonicalActivity, teamActivities, formatActivities, countActivities,
} from "../src/Helpers/activities.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

check("القائمة كما في نموذج اللاعب", ACTIVITIES, ["كرة القدم", "كرة السلة", "كرة اليد", "كرة الطائرة"]);

// صيغ كرة القدم التي ظهرت فعلاً في بيانات الأندية.
check("كرة القدم كما هي", canonicalActivity("كرة القدم"), "كرة القدم");
check("بالهاء بدل التاء", canonicalActivity("كره القدم"), "كرة القدم");
check("بلا ألف ولام", canonicalActivity("كرة قدم"), "كرة القدم");
check("بالإنجليزية وبخطأ إملائي", canonicalActivity("FOOTBAL"), "كرة القدم");
check("مسافات زائدة", canonicalActivity("  كرة   القدم "), "كرة القدم");
check("قدم وحدها", canonicalActivity("قدم"), "كرة القدم");

check("كرة الطائرة بالياء", canonicalActivity("كرة الطايرة"), "كرة الطائرة");
check("الطائرة بالإنجليزية", canonicalActivity("Volleyball"), "كرة الطائرة");
check("كرة السلة", canonicalActivity("كره السله"), "كرة السلة");
check("كرة اليد", canonicalActivity("كرة يد"), "كرة اليد");
check("«يد» داخل كلمة أخرى ليست كرة اليد", canonicalActivity("نشاط جديد"), "نشاط جديد");

// ما لا نعرفه لا يُرمى: يبقى كما كُتب كي لا يختفي فريق من الإحصاء.
check("نشاط غير معروف يبقى", canonicalActivity("سباحة"), "سباحة");
check("الفارغ لا شيء", canonicalActivity("  "), null);

// الفريق ذو النشاطين.
check("فاصلة عربية", teamActivities("كرة القدم، كرة السلة"), ["كرة القدم", "كرة السلة"]);
check("فاصلة لاتينية وتكرار", teamActivities("كرة القدم,كره القدم , football"), ["كرة القدم"]);
check("بالواو", teamActivities("كرة القدم وكرة الطائرة"), ["كرة القدم", "كرة الطائرة"]);
check("فارغ", teamActivities(null), []);

check("التخزين بفاصلة عربية", formatActivities(["كرة السلة", "كره القدم"]), "كرة السلة، كرة القدم");

const counts = countActivities([
    { activities: "كرة القدم" },
    { activities: "كره القدم" },
    { activities: "FOOTBAL" },
    { activities: "كرة القدم، كرة السلة" },
    { activities: "" },
]);
check("الإحصاء يجمع الصيغ في نشاط واحد", counts["كرة القدم"], 4);
check("وذو النشاطين يُعدّ في الثاني أيضاً", counts["كرة السلة"], 1);
check("وبلا نشاط «غير محدد»", counts[UNSPECIFIED], 1);
check("ولا مفاتيح غيرها", Object.keys(counts).sort(), ["غير محدد", "كرة السلة", "كرة القدم"].sort());

console.log(`\n${pass} نجح، ${fail} فشل`);
process.exit(fail ? 1 : 0);
