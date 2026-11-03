// The audit's own tests: each check must fire on a page broken the way the
// dashboards once were, and stay quiet on a clean one.
//
//   cd e2e && npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { auditPage } from "./checks.mjs";

let browser, page;
before(async () => {
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
});
after(() => browser?.close());

// table-library's own layout: one grid for the whole table, rows dissolve into it.
const TABLE_CSS = `
    table { display: grid; grid-template-columns: var(--data-table-library_grid-template-columns); }
    thead, tbody, .tr { display: contents; }
    .th, .td { padding: 4px; }
`;
const table = (tracks, cols, rows = 2) => `
    <table style="--data-table-library_grid-template-columns: ${tracks}">
        <thead><tr class="tr tr-header">${Array.from({ length: cols }, (_, i) => `<th class="th">ع${i}</th>`).join("")}</tr></thead>
        <tbody>${Array.from({ length: rows }, () =>
            `<tr class="tr">${Array.from({ length: cols }, (_, i) => `<td class="td">${i}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;

const audit = async (body, css = "") => {
    await page.setContent(`<html dir="rtl"><head><style>body{margin:0;font:14px sans-serif} ${TABLE_CSS} ${css}</style></head><body>${body}</body></html>`);
    return page.evaluate(auditPage);
};
const kinds = (findings) => [...new Set(findings.map((f) => f.kind))].sort();

test("a clean page has no findings", async () => {
    const findings = await audit(`<h1>الإعارات</h1><button>إعارة لاعب</button>${table("100px 100px 100px", 3)}<p>2026-07-01</p>`);
    assert.deepEqual(findings, []);
});

test("a value printed as null / undefined / NaN is caught", async () => {
    const findings = await audit(`<p>تاريخ البداية: null</p><span>undefined</span><b>NaN ر.ع</b>`);
    assert.deepEqual(kinds(findings), ["leaked-value"]);
    assert.equal(findings.length, 3);
});

test("words that merely contain null are not", async () => {
    assert.deepEqual(await audit(`<p>nullable annulled</p>`), []);
});

test("a column without its width is caught — the loans page, 17 columns on 16 widths", async () => {
    const findings = await audit(table("100px 100px", 3));
    assert.deepEqual(kinds(findings), ["table-grid"]);
    assert.match(findings.map((f) => f.detail).join(" "), /3 عموداً على 2 عرضاً/);
    assert.match(findings.map((f) => f.detail).join(" "), /انكسر/);
});

test("a page that scrolls sideways is caught", async () => {
    const findings = await audit(`<div style="width:1600px">عريض</div>`);
    assert.deepEqual(kinds(findings), ["page-overflow"]);
});

test("a wide table inside its own scroller is fine", async () => {
    assert.deepEqual(await audit(`<div style="overflow-x:auto">${table("400px 400px 400px", 3)}</div>`), []);
});

test("a button hidden under a bar is caught — the bulk bar over the last request", async () => {
    const findings = await audit(
        `<div style="height:640px"></div><button style="display:block;width:200px">اعتماد</button>
         <div style="position:fixed;bottom:0;left:0;right:0;height:120px;background:#eee">شريط القرار الجماعي</div>`,
    );
    assert.ok(kinds(findings).includes("covered"), JSON.stringify(findings));
});

test("two labels drawn on top of each other are caught", async () => {
    const findings = await audit(
        `<div style="position:relative;height:40px">
            <a href="#" style="position:absolute;top:0;right:0">الإعارات</a>
            <a href="#" style="position:absolute;top:2px;right:4px">الانتقالات</a>
         </div>`,
    );
    assert.ok(kinds(findings).includes("overlap"), JSON.stringify(findings));
});

test("a button pushed out past its card is caught — the payments card on a phone", async () => {
    const findings = await audit(
        `<div class="mantine-Paper-root" style="width:300px;border:1px solid #ccc;margin:40px">
            <div style="display:flex;flex-wrap:nowrap;gap:8px">
                <div style="flex:1;min-width:200px">بيان طويل للطلب</div>
                <button style="white-space:nowrap">اعتماد الإيصال</button>
                <button style="white-space:nowrap">رفض</button>
            </div>
         </div>`,
    );
    assert.ok(kinds(findings).includes("escapes-card"), JSON.stringify(findings));
});

test("a card whose buttons wrap under the text is fine", async () => {
    const findings = await audit(
        `<div class="mantine-Paper-root" style="width:300px;border:1px solid #ccc;margin:40px">
            <div style="display:flex;flex-wrap:wrap;gap:8px">
                <div style="flex:1;min-width:200px">بيان طويل للطلب</div>
                <button style="white-space:nowrap">اعتماد الإيصال</button>
                <button style="white-space:nowrap">رفض</button>
            </div>
         </div>`,
    );
    assert.deepEqual(findings, []);
});

test("with a window open, only the window is judged — the dimmed page behind it is meant to be covered", async () => {
    const findings = await audit(
        `<button>زر في الصفحة</button><a href="#">رابط في الصفحة</a>
         <div style="position:fixed;inset:0;background:rgba(0,0,0,.5)"></div>
         <div role="dialog" style="position:fixed;top:100px;left:100px;width:400px;background:#fff">
            <h2>إضافة رسالة</h2><button>إرسال</button>
         </div>`,
    );
    assert.deepEqual(findings, []);
});

test("but a broken window is still caught", async () => {
    const findings = await audit(
        `<div role="dialog" style="position:fixed;top:100px;left:100px;width:400px;background:#fff">
            <button>إرسال</button>
            <div style="position:absolute;inset:0;background:#fff">غطاء</div>
         </div>`,
    );
    assert.ok(kinds(findings).includes("covered"), JSON.stringify(findings));
});
