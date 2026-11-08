// «حسابات الأعضاء» في النادي — حسابات أعضاء فرقه كلها في مكان واحد.
//
// العميل (2026-11-08): «هذا العضو يدفع سنوياً للنادي… نفس فكرة حسابات الأعضاء في
// الفريق… ممكن نسوي على النادي جميع حسابات الأعضاء». فالصفحة تجمع ما يُسجَّل في
// موضعين: دفعات حسابات الأعضاء في كل فريق، ورسوم العضوية السنوية المعتمدة على
// طريق «تسجيل عضو جديد». والشخص يُقرأ مرة واحدة — بالرقم المدني — مهما تعدّدت
// صفاته وفرقه («ما يكون متكرر»).
//
// قرارات محضة: لا قاعدة بيانات.

/** اليوم YYYY-MM-DD من نصٍّ أو من تاريخٍ تعيده قاعدة البيانات كائناً. */
export const dayOf = (date) => {
    if (!date) return null;
    if (date instanceof Date) return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
    const match = String(date).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
};

const yearOf = (date) => {
    const day = dayOf(date);
    return day ? Number(day.slice(0, 4)) : null;
};

/** دفعةٌ تُحسب: مسدَّدة، أو بلا حالة (دفعات الفريق القديمة). */
export const countsAsPaid = (status) => !status || status === "paid" || status === "accepted";

const keyOf = (row) => {
    const card = String(row?.card_number || "").trim();
    return card ? `card:${card}` : `${row?.source || row?.kind || "row"}:${row?.id || ""}`;
};

const round = (n) => Math.round(Number(n || 0) * 100) / 100;

/**
 * @param {object} input
 * @param {Array} input.members   أعضاء العضوية: {id, name, card_number, membership_number, team, subscription_date}
 * @param {Array} input.payments  {id, name, card_number, team, kind, amount, date, status, source, note}
 * @param {number} input.year     السنة التي يُسأل عن سدادها
 */
export const buildMemberAccounts = ({ members = [], payments = [], year }) => {
    const rows = new Map();
    const rowFor = (seed) => {
        const key = keyOf(seed);
        if (!rows.has(key)) {
            rows.set(key, {
                key,
                name: seed.name || "",
                card_number: seed.card_number || null,
                membership_number: null,
                teams: new Set(),
                kinds: new Set(),
                subscribedYear: null,
                payments: [],
            });
        }
        return rows.get(key);
    };

    members.forEach((member) => {
        const row = rowFor({ ...member, source: "assembly" });
        row.kinds.add("عضو");
        if (member.team) row.teams.add(member.team);
        if (member.membership_number) row.membership_number = member.membership_number;
        const subscribed = yearOf(member.subscription_date);
        if (subscribed && (!row.subscribedYear || subscribed > row.subscribedYear)) row.subscribedYear = subscribed;
        if (!row.name) row.name = member.name || "";
    });

    payments.filter((payment) => countsAsPaid(payment.status)).forEach((payment) => {
        const row = rowFor(payment);
        if (payment.kind) row.kinds.add(payment.kind);
        if (payment.team) row.teams.add(payment.team);
        if (!row.name) row.name = payment.name || "";
        row.payments.push({
            amount: round(payment.amount),
            date: dayOf(payment.date),
            source: payment.source || "حساب الفريق",
            team: payment.team || null,
            note: payment.note || null,
        });
    });

    const list = [...rows.values()].map((row) => {
        const sorted = [...row.payments].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        const thisYear = sorted.filter((p) => yearOf(p.date) === year);
        const paidThisYear = round(thisYear.reduce((sum, p) => sum + p.amount, 0));
        return {
            key: row.key,
            name: row.name,
            card_number: row.card_number,
            membership_number: row.membership_number,
            teams: [...row.teams],
            kinds: [...row.kinds],
            paidThisYear,
            totalPaid: round(sorted.reduce((sum, p) => sum + p.amount, 0)),
            lastPaymentDate: sorted[0]?.date || null,
            // سدّد سنته: دفع فيها، أو اشتراكه في العضوية مسجَّلٌ لها.
            subscribedThisYear: paidThisYear > 0 || (row.subscribedYear !== null && row.subscribedYear >= year),
            payments: sorted,
        };
    }).sort((a, b) => a.name.localeCompare(b.name, "ar"));

    return {
        year,
        rows: list,
        totalThisYear: round(list.reduce((sum, row) => sum + row.paidThisYear, 0)),
        members: list.length,
        paidMembers: list.filter((row) => row.subscribedThisYear).length,
    };
};
