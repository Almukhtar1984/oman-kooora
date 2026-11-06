// Journeys through the club and team dashboards, on a LOCAL stack: what the client
// reported on 2026-11-05, walked the way the client walked it. Read-only — nothing
// is accepted, rejected or saved.
//
//   API_URL=http://localhost:7002 npm run journeys
//
// A group the local data has nothing for is skipped, not failed.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { APPS, openApp } from "./support.mjs";

let browser, club, team;
before(async () => {
    browser = await chromium.launch();
    club = await openApp(browser, APPS.club);
    team = await openApp(browser, APPS.team);
});
after(() => browser?.close());

const go = async (page, url) => {
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(500);
};

const hubGroups = async (page) => {
    await go(page, `${APPS.club.url}/requests`);
    const cards = page.locator("a").filter({ has: page.locator('[class*="-Badge-root"]') }).filter({ visible: true });
    const groups = [];
    for (let i = 0; i < await cards.count(); i++) {
        const card = cards.nth(i);
        const href = await card.getAttribute("href");
        if (href?.includes("pending=")) {
            groups.push({ href, count: Number(await card.locator('[class*="-Badge-root"]').innerText()) });
        }
    }
    return groups;
};

test("«الطلبات» opens on the request itself, and «عرض الكل» gives the list back", async () => {
    const { page } = club;
    const groups = await hubGroups(page);
    assert.ok(groups.length > 0, "local data should hold at least one pending group");

    for (const { href, count } of groups) {
        await go(page, `${APPS.club.url}/requests`);
        await page.locator(`a[href="${href}"]`).click();
        await page.waitForURL((url) => url.search.includes("pending="), { timeout: 30000 });
        await page.waitForLoadState("networkidle");

        const bar = page.getByText(`تعرض الطلبات التي تنتظر قرارك فقط (${count})`);
        await bar.waitFor({ state: "visible", timeout: 30000 });

        await page.getByRole("button", { name: "عرض الكل" }).click();
        await page.waitForFunction(() => !window.location.search.includes("pending="), null, { timeout: 15000 });
        await bar.waitFor({ state: "hidden", timeout: 15000 });
    }
});

test("«تسجيل مجلس إدارة» opens on the board tab, not on the players", async () => {
    const { page } = club;
    await go(page, `${APPS.club.url}/members?tab=members`);
    const tab = page.getByRole("tab", { name: "مجلس الإدارة" });
    assert.equal(await tab.getAttribute("aria-selected"), "true");
});

test("«تحديد كل قيد الانتظار» brings what it selected into view, and clearing restores the list", async () => {
    const { page } = club;
    await go(page, `${APPS.club.url}/players`);
    const button = page.getByRole("button", { name: /تحديد كل قيد الانتظار/ });
    if (!(await button.count())) return;
    const pending = Number((await button.innerText()).match(/\d+/)?.[0]);

    await button.click();
    const bar = page.getByText(`تعرض الطلبات التي تنتظر قرارك فقط (${pending})`);
    await bar.waitFor({ state: "visible", timeout: 10000 });
    assert.equal(await page.getByText(`محدّد: ${pending}`).count(), 1);

    await page.getByRole("button", { name: "إلغاء التحديد" }).click();
    await bar.waitFor({ state: "hidden", timeout: 10000 });
});

test("the technical staff page answers clicks — it used to hang in a render loop", async () => {
    const { page } = club;
    await go(page, `${APPS.club.url}/members`);
    await page.getByRole("tab", { name: "الجهاز الفني" }).click();
    await page.waitForTimeout(1500);

    const started = Date.now();
    await page.getByRole("tab", { name: "مجلس الإدارة" }).click();
    await page.waitForFunction(
        () => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.includes("مجلس الإدارة"),
        null, { timeout: 5000 },
    );
    assert.ok(Date.now() - started < 3000, `tab took ${Date.now() - started} ms`);

    await page.getByRole("tab", { name: "الجهاز الفني" }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("link", { name: "الفرق" }).first().click();
    await page.waitForURL((url) => url.pathname === "/team", { timeout: 15000 });
});

test("the price list has the new cases the client asked for", async () => {
    const { page } = club;
    await go(page, `${APPS.club.url}/fees`);
    for (const label of [
        "تسجيل لاعب — فوق 18 سنة", "تسجيل لاعب — تحت 18 سنة",
        "إعارة لاعب — داخلية", "إعارة لاعب — خارجية",
        "انتقال لاعب — داخلي", "انتقال لاعب — خارجي",
        "تسجيل فريق", "استقالة لاعب", "تسجيل في المسابقات",
    ]) {
        await page.getByText(label, { exact: true }).waitFor({ state: "visible", timeout: 15000 });
    }
});

test("the team's «طلبات اللاعبين» options open onto a real choice", async () => {
    const { page } = team;
    await go(page, `${APPS.team.url}/requests`);
    const buttons = page.getByRole("button", { name: "خيارات الطلب" });
    if (!(await buttons.count())) return;
    await buttons.first().click();
    await page.getByRole("menuitem").first().waitFor({ state: "visible", timeout: 5000 });
    await page.keyboard.press("Escape");
});
