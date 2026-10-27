// عدّاد الطلبات: محسوب من العمل المعلّق نفسه، لا من إشعارات تُقرأ.
//
// ولهذا لا ينزل بفتح القائمة — بل باتخاذ القرار على الطلب، وهي القاعدة التي
// طلبها المالك حرفياً.

import { summarizePending, REQUEST_TYPES } from "../src/Helpers/pendingRequests.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

const empty = summarizePending({});
check("بلا طلبات: العدّاد صفر", empty.total, 0);
check("ولا تُعرض مجموعات فارغة", empty.groups.length, 0);

const some = summarizePending({ players: 53, releases: 2, news: 1, transfers: 0 });
check("الإجمالي يجمع كل المجموعات", some.total, 56);
check("المجموعات الفارغة تُحذف", some.groups.map((g) => g.key), ["players", "releases", "news"]);
check("لكل مجموعة وجهة يفتحها النادي", some.groups.every((g) => g.href.startsWith("/")), true);
check("ولكل مجموعة اسم عربي", some.groups.every((g) => g.label.trim().length > 0), true);

check("تسجيل اللاعبين أولاً في الترتيب", some.groups[0].key, "players");
check("إخلاء الطرف ضمن الأنواع", REQUEST_TYPES.some((t) => t.key === "releases"), true);
check("والانتقالات والإعارات نوعان مستقلان",
    REQUEST_TYPES.filter((t) => t.key === "transfers" || t.key === "loans").length, 2);

// الإيصالات المرفوعة تنتظر قرار النادي أيضاً، فهي من الطلبات.
const withPayments = summarizePending({ payments: 3, players: 1 });
check("الإيصالات المرفوعة ضمن الطلبات", withPayments.groups.map((g) => g.key), ["players", "payments"]);
check("وتُفتح على صفحة المدفوعات",
    withPayments.groups.find((g) => g.key === "payments").href, "/payments");
check("وتُحسب في الإجمالي", withPayments.total, 4);

const messy = summarizePending({ players: "7", members: null, loans: undefined, news: -0 });
check("قيمة نصية تُقرأ عدداً", messy.total, 7);
check("والقيم الفارغة لا تُحسب", messy.groups.length, 1);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
