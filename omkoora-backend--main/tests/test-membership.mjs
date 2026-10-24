// العضوية الموحّدة: تنظيف المرشّحات وعدّ التصنيفات.
//
// نادٍ فيه مئات اللاعبين كان يقرأ «لا يوجد بيانات» في صفحة الأعضاء لأنها تقرأ
// جدول الجمعية وحده. التوحيد في القراءة لا في التخزين — وسجل الجمعية يحتفظ
// بأرقام العضوية وتواريخها كما طلب المالك.

import {
    MEMBERSHIP_KINDS, kindLabel, membershipCounts, normalizeMembershipFilters,
} from "../src/Helpers/membership.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

check("التصنيفات الأربعة", MEMBERSHIP_KINDS.map((k) => k.kind), ["player", "technical", "board", "assembly"]);
check("«عضو أساسي» اسم تصنيف الجمعية", kindLabel("assembly"), "عضو أساسي");
check("تصنيف مجهول بلا اسم", kindLabel("ghost"), "");

// المرشّحات — ما لا يُفهم يُسقَط بدل أن يُمرَّر فيُخفي الأعضاء كلهم.
check("تصنيف مجهول يُسقَط", normalizeMembershipFilters({ kind: "ghost" }).kind, null);
check("تصنيف معروف يمر", normalizeMembershipFilters({ kind: "board" }).kind, "board");
check("حالة مجهولة تُسقَط", normalizeMembershipFilters({ status: "maybe" }).status, null);
check("حالة معروفة تمر", normalizeMembershipFilters({ status: "waiting" }).status, "waiting");
check("بحث بفراغات فقط يُعدّ فارغاً", normalizeMembershipFilters({ search: "   " }).search, null);
check("البحث يُقلَّم", normalizeMembershipFilters({ search: "  محمد " }).search, "محمد");

check("الحد الافتراضي 50", normalizeMembershipFilters({}).limit, 50);
check("حدّ ضخم يُقلَّم إلى 200", normalizeMembershipFilters({ limit: 5000 }).limit, 200);
check("حدّ صفري يصير 1 على الأقل", normalizeMembershipFilters({ limit: 0 }).limit, 50);
check("الصفحة الثالثة تعني تخطي 100", normalizeMembershipFilters({ page: 3, limit: 50 }).offset, 100);
check("صفحة سالبة تعود للأولى", normalizeMembershipFilters({ page: -4 }).offset, 0);

// العدّادات: كل تصنيف يظهر ولو بصفر، لأن الصفر معلومة أيضاً.
const counts = membershipCounts([{ kind: "player", count: 211 }, { kind: "assembly", count: "7" }]);
check("كل التصنيفات معروضة", counts.map((c) => c.kind), ["player", "technical", "board", "assembly"]);
check("العدد المفقود صفر", counts.find((c) => c.kind === "technical").count, 0);
check("العدد النصّي يُقرأ رقماً", counts.find((c) => c.kind === "assembly").count, 7);
check("والأسماء بالعربية", counts.find((c) => c.kind === "player").label, "لاعب");

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
