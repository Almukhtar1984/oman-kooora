// ملخّص المصاريف يحسب حسابات الأعضاء — «كم الإيرادات، كم النفقات، وكم يكون
// حسابات مجموع الأعضاء، وكم الصافي» (العميل).

import { summarizeLedger } from "../src/Helpers/ledgerSummary.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

// أرقام الفيديو: إيرادات 1287، نفقات 362، وفؤاد دفع ثمانية.
const summary = summarizeLedger({
    values: [1000, 287, -300, -62],
    memberPayments: [{ amount: 8 }, { amount: 5, status: "paid" }, { amount: 20, status: "pending" }, { amount: 4, status: "unpaid" }],
});
check("الإيرادات", summary.profits, 1287);
check("والنفقات", summary.expenses, 362);
check("والصافي القديم كما كان", summary.net, 925);
check("وحسابات الأعضاء: المسجّل والمسدّد وحدهما", summary.memberAccounts, 13);
check("والصافي مع حسابات الأعضاء", summary.balance, 938);

check("دفترٌ فارغ أصفار", summarizeLedger({}), { profits: 0, expenses: 0, net: 0, memberAccounts: 0, balance: 0 });
check("والكسور بثلاث منازل (البيسة)", summarizeLedger({ values: [0.1, 0.2] }).profits, 0.3);
check("وقيمة نصّية تُقرأ رقماً", summarizeLedger({ values: ["50", "-20"] }).net, 30);

console.log(`\n${pass} نجح، ${fail} فشل`);
process.exit(fail ? 1 : 0);
