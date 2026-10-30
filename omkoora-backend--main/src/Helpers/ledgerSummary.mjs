// ملخّص المصاريف — ومعه حسابات الأعضاء.
//
// العميل (اجتماع 2026-10-30) عن ملخّص صفحة المصروفات: «كم الإيرادات، كم
// النفقات، وكم يكون حسابات مجموع الأعضاء، وهنا كم يكون الصافي». حسابات الأعضاء
// دفترٌ مستقلّ عن الصادر والوارد (member_payments)، فكان الملخّص يُسقطها، ويرى
// الفريق صافياً أقلّ مما في صندوقه.
//
// قرارات محضة: لا قاعدة بيانات.

const round = (value) => Math.round((Number(value) || 0) * 1000) / 1000;

// الدفعة التي تُحسب: ما سجّله الفريق في دفتره (بلا حالة)، أو ما سُدّد فعلاً.
// المعلّق وغير المسدّد وعدٌ لا مال.
const settled = (payment) => !payment?.status || payment.status === "paid";

/**
 * @param {{ values?: number[], memberPayments?: {amount:number, status?:string}[] }} input
 *        values — قيم الصادر والوارد بإشاراتها (موجب وارد، سالب صادر)
 * @returns {{ profits:number, expenses:number, net:number, memberAccounts:number, balance:number }}
 *        net     — الإيرادات ناقص النفقات، كما كان (لمن يقرؤه).
 *        balance — الصافي الذي طلبه العميل: الإيرادات + حسابات الأعضاء − النفقات.
 */
export const summarizeLedger = ({ values = [], memberPayments = [] } = {}) => {
    const profits = round(values.filter((v) => Number(v) > 0).reduce((sum, v) => sum + Number(v), 0));
    const expenses = round(values.filter((v) => Number(v) < 0).reduce((sum, v) => sum + Math.abs(Number(v)), 0));
    const memberAccounts = round(memberPayments.filter(settled).reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
    return {
        profits,
        expenses,
        net: round(profits - expenses),
        memberAccounts,
        balance: round(profits + memberAccounts - expenses),
    };
};
