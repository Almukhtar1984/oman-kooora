// تنزيل المصروفات — Excel أو PDF.
//
// العميل: «المصروفات… نريد أكسل، أو تنزيل PDF». والتنزيل يأخذ ما يراه الفريق في
// الجدول (بعد البحث وتصفية التاريخ) ومعه ملخّصه، كي يطابق الملفُّ الشاشة.
//
// والـ PDF يُطبع من المتصفّح لا يُرسم بمكتبة: العربية في مكتبات الـ PDF تخرج
// حروفاً منفصلة ومقلوبة الاتجاه، والمتصفّح يرسمها كما تُرى — و«حفظ كـ PDF» في
// نافذة الطباعة يخرجها ملفاً.

import dayjs from "dayjs";

export type LedgerSummary = {
    profits?: number | null;
    expenses?: number | null;
    memberAccounts?: number | null;
    balance?: number | null;
};

export type LedgerRow = { date: string; kind: string; amount: number; note: string };

/** سطور الجدول كما تُكتب في الملف: التاريخ، صادر/وارد، المبلغ بلا إشارة، البيان. */
export const ledgerRows = (list: any[]): LedgerRow[] => (list || []).map((item) => {
    const value = Number(item?.value) || 0;
    return {
        date: item?.createdAt ? dayjs(item.createdAt).format("YYYY-MM-DD") : "",
        kind: value < 0 ? "صادر" : "وارد",
        amount: Math.abs(value),
        note: String(item?.note || ""),
    };
});

/** سطور الملخّص بالترتيب الذي طلبه العميل. */
export const summaryRows = (summary?: LedgerSummary | null): [string, number][] => [
    ["الإيرادات", Number(summary?.profits) || 0],
    ["النفقات", Number(summary?.expenses) || 0],
    ["حسابات الأعضاء", Number(summary?.memberAccounts) || 0],
    ["الصافي (الإيرادات + حسابات الأعضاء − النفقات)", Number(summary?.balance) || 0],
];

const fileName = (team: string, extension: string) =>
    `المصروفات - ${team || "الفريق"} - ${dayjs().format("YYYY-MM-DD")}.${extension}`;

/** ملف Excel بورقتين: الحركات والملخّص، من اليمين إلى اليسار. */
export const downloadLedgerExcel = async (list: any[], summary: LedgerSummary | null | undefined, team: string) => {
    const XLSX = await import("xlsx");
    const rows = ledgerRows(list);

    const moves = XLSX.utils.aoa_to_sheet([
        ["التاريخ", "النوع", "المبلغ (ر.ع)", "البيان"],
        ...rows.map((row) => [row.date, row.kind, row.amount, row.note]),
    ]);
    moves["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 48 }];

    const totals = XLSX.utils.aoa_to_sheet([["البند", "المبلغ (ر.ع)"], ...summaryRows(summary)]);
    totals["!cols"] = [{ wch: 44 }, { wch: 14 }];

    const book = XLSX.utils.book_new();
    book.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(book, moves, "الحركات");
    XLSX.utils.book_append_sheet(book, totals, "الملخص");
    XLSX.writeFile(book, fileName(team, "xlsx"));
};

const escapeHtml = (text: string) => text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const money = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 3 });

/** صفحة الطباعة نفسها — نصٌّ كامل يُكتب في النافذة، فيُختبر بلا متصفّح. */
export const ledgerPrintHtml = (list: any[], summary: LedgerSummary | null | undefined, team: string) => {
    const rows = ledgerRows(list);
    const body = rows.map((row) => `
        <tr>
            <td>${escapeHtml(row.date)}</td>
            <td class="${row.kind === "صادر" ? "out" : "in"}">${row.kind}</td>
            <td class="num">${money(row.amount)}</td>
            <td>${escapeHtml(row.note)}</td>
        </tr>`).join("");
    const totals = summaryRows(summary).map(([label, value], index, all) => `
        <tr${index === all.length - 1 ? ' class="total"' : ""}><th>${label}</th><td class="num">${money(value)} ر.ع</td></tr>`).join("");

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(fileName(team, "pdf"))}</title>
<style>
    @page { size: A4; margin: 16mm 14mm; }
    body { font-family: "Tajawal", "Segoe UI", "Geeza Pro", Arial, sans-serif; color: #1f2937; margin: 0 auto; padding: 24px; max-width: 900px; }
    @media print { body { padding: 0; max-width: none; } }
    header { border-bottom: 3px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin: 0; color: #1d4ed8; }
    .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: right; }
    thead th { background: #eff6ff; }
    .num { text-align: left; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .in { color: #047857; } .out { color: #b91c1c; }
    h2 { font-size: 14px; margin: 20px 0 8px; }
    .totals { width: 60%; }
    .totals th { background: #f9fafb; font-weight: 600; }
    .total th, .total td { background: #fffbeb; font-weight: 700; }
    .empty { color: #6b7280; text-align: center; padding: 16px; }
</style>
</head>
<body>
<header>
    <h1>المصروفات — ${escapeHtml(team || "الفريق")}</h1>
    <div class="meta">تاريخ التقرير: ${dayjs().format("YYYY-MM-DD")} — عدد الحركات: ${rows.length}</div>
</header>
<table>
    <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ (ر.ع)</th><th>البيان</th></tr></thead>
    <tbody>${body || '<tr><td colspan="4" class="empty">لا حركات في هذه الفترة</td></tr>'}</tbody>
</table>
<h2>الملخص</h2>
<table class="totals"><tbody>${totals}</tbody></table>
</body>
</html>`;
};

/** يفتح صفحة الطباعة؛ ومنها «حفظ كـ PDF». */
export const printLedger = (list: any[], summary: LedgerSummary | null | undefined, team: string): boolean => {
    const view = window.open("", "_blank");
    if (!view) return false;
    view.document.open();
    view.document.write(ledgerPrintHtml(list, summary, team));
    view.document.close();
    view.focus();
    // تُطبع بعد أن تُرسم الخطوط، وإلا خرجت الصفحة الأولى بخطّ بديل.
    view.onload = () => view.print();
    setTimeout(() => { try { view.print(); } catch { /* أُغلقت النافذة */ } }, 600);
    return true;
};
