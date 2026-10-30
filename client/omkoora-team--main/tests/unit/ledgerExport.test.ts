import { describe, expect, it, vi } from "vitest";

import { downloadLedgerExcel, ledgerPrintHtml, ledgerRows, summaryRows } from "../../lib/helpers/ledgerExport";

const written = vi.hoisted(() => ({ book: null as any, name: "" }));
vi.mock("xlsx", async (original) => {
    const real: any = await original();
    return { ...real, writeFile: (book: any, name: string) => { written.book = book; written.name = name; } };
});

// تنزيل المصروفات: «نريد أكسل، أو تنزيل PDF» (العميل). الملف يطابق الشاشة،
// والملخّص يحمل حسابات الأعضاء.

const list = [
    { value: 1287, note: "اشتراكات الموسم", createdAt: "2026-05-16T10:00:00Z" },
    { value: -362, note: "أدوات <تدريب>", createdAt: "2026-05-17T10:00:00Z" },
];
const summary = { profits: 1287, expenses: 362, memberAccounts: 8, balance: 933 };

describe("تنزيل المصروفات", () => {
    it("السطور: التاريخ والنوع والمبلغ بلا إشارة والبيان", () => {
        expect(ledgerRows(list)).toEqual([
            { date: "2026-05-16", kind: "وارد", amount: 1287, note: "اشتراكات الموسم" },
            { date: "2026-05-17", kind: "صادر", amount: 362, note: "أدوات <تدريب>" },
        ]);
    });

    it("والملخّص بالترتيب الذي طلبه العميل، ومعه حسابات الأعضاء", () => {
        expect(summaryRows(summary).map(([label]) => label)).toEqual([
            "الإيرادات", "النفقات", "حسابات الأعضاء", "الصافي (الإيرادات + حسابات الأعضاء − النفقات)",
        ]);
        expect(summaryRows(null).every(([, value]) => value === 0)).toBe(true);
    });

    it("وصفحة الـ PDF من اليمين، وتحمي النصّ المكتوب يداً", () => {
        const html = ledgerPrintHtml(list, summary, "فريق الطموح");
        expect(html).toContain('dir="rtl"');
        expect(html).toContain("المصروفات — فريق الطموح");
        expect(html).toContain("أدوات &lt;تدريب&gt;");
        expect(html).not.toContain("<تدريب>");
        expect(html).toContain("933 ر.ع");
    });

    it("وفترةٌ بلا حركات تقول ذلك", () => {
        expect(ledgerPrintHtml([], summary, "")).toContain("لا حركات في هذه الفترة");
    });

    it("وملف Excel بورقتين من اليمين: الحركات والملخّص", async () => {
        await downloadLedgerExcel(list, summary, "فريق الطموح");
        expect(written.name).toMatch(/^المصروفات - فريق الطموح - \d{4}-\d{2}-\d{2}\.xlsx$/);
        expect(written.book.SheetNames).toEqual(["الحركات", "الملخص"]);
        expect(written.book.Workbook.Views[0].RTL).toBe(true);
        const moves = written.book.Sheets["الحركات"];
        expect([moves.A1.v, moves.B2.v, moves.C3.v, moves.D3.v]).toEqual(["التاريخ", "وارد", 362, "أدوات <تدريب>"]);
        const totals = written.book.Sheets["الملخص"];
        expect([totals.A4.v, totals.B5.v]).toEqual(["حسابات الأعضاء", 933]);
    });
});
