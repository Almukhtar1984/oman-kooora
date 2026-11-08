// «حسابات الأعضاء» في النادي — ما تعرضه الصفحة وتصدّره.
//
// قرارات محضة: لا واجهة.

export type MemberAccountPayment = {
    amount: number;
    date: string | null;
    source: string | null;
    team: string | null;
    note: string | null;
};

export type MemberAccount = {
    key: string;
    name: string;
    card_number: string | null;
    membership_number: string | null;
    teams: string[];
    kinds: string[];
    paidThisYear: number;
    totalPaid: number;
    lastPaymentDate: string | null;
    subscribedThisYear: boolean;
    payments: MemberAccountPayment[];
};

export type AccountFilter = {
    search?: string;
    team?: string | null;
    paid?: "all" | "paid" | "unpaid";
};

const toAsciiDigits = (text: string) => text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

/** البحث بالاسم أو الرقم المدني أو رقم العضوية، والفريق، ومن سدّد سنته. */
export const filterAccounts = (rows: MemberAccount[], { search = "", team = null, paid = "all" }: AccountFilter) => {
    const term = toAsciiDigits(search.trim()).toLowerCase();
    return rows.filter((row) => {
        if (team && !row.teams.includes(team)) return false;
        if (paid === "paid" && !row.subscribedThisYear) return false;
        if (paid === "unpaid" && row.subscribedThisYear) return false;
        if (!term) return true;
        return [row.name, row.card_number, row.membership_number]
            .some((value) => String(value || "").toLowerCase().includes(term));
    });
};

/** الفرق التي تظهر في القائمة — لفلتر الفريق. */
export const teamsOf = (rows: MemberAccount[]) =>
    Array.from(new Set(rows.flatMap((row) => row.teams))).sort((a, b) => a.localeCompare(b, "ar"));

/** صفوف ملف Excel، بالعناوين التي تقرؤها الأندية. */
export const accountsSheet = (rows: MemberAccount[], year: number) => rows.map((row) => ({
    "الاسم": row.name,
    "الرقم المدني": row.card_number || "-",
    "رقم العضوية": row.membership_number || "-",
    "الفريق": row.teams.join("، ") || "-",
    "الصفة": row.kinds.join("، ") || "-",
    [`سدّد ${year}`]: row.subscribedThisYear ? "نعم" : "لا",
    [`المدفوع في ${year} (ر.ع)`]: row.paidThisYear,
    "إجمالي المدفوع (ر.ع)": row.totalPaid,
    "آخر دفعة": row.lastPaymentDate || "-",
}));
