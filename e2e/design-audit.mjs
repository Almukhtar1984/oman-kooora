#!/usr/bin/env node
/**
 * Design audit of the club and team dashboards.
 *
 * Opens every page at desktop and phone width, logged in with the LOCAL seed
 * accounts (omkoora-backend--main/scripts/seed-club-admin.mjs and
 * seed-local-demo.mjs), runs the checks in checks.mjs, and saves a full-page
 * screenshot of each for a human look. Exits 1 when anything fails.
 *
 * Local only: it refuses any host but localhost, so it can never log in to
 * production or write a screenshot of real members' data.
 *
 *   cd e2e && npm install
 *   API_URL=http://localhost:7002 CLUB_URL=http://localhost:3050 TEAM_URL=http://localhost:3053 npm run audit
 *
 *   ONLY=team:/players_loan npm run audit     one page (comma-separated for several)
 *   VIEWPORTS=desktop npm run audit           one width
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { auditOpenMenu, auditPage } from "./checks.mjs";
import { APPS, login } from "./support.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "output");

const VIEWPORTS = {
    desktop: { width: 1440, height: 900 },
    phone: { width: 390, height: 844 },
};

// The pages, and which were reworked in the last rounds (marked ★ in the report).
const PAGES = {
    club: [
        ["/", false], ["/tracking", true], ["/players", true], ["/players_loan", true],
        ["/players_transfer", true], ["/releases", true], ["/payments", true], ["/fees", true],
        ["/forms", true], ["/blog", true], ["/inbox", true], ["/outbox", false], ["/messages", true],
        ["/meetings", false], ["/members", false], ["/membership", false], ["/technicalApparatus", false],
        ["/team", true], ["/committees", false], ["/assembly", false], ["/powers", false],
        ["/requests", true], ["/statistics", false], ["/monitor", false],
    ],
    team: [
        ["/", false], ["/pending", true], ["/tracking", true], ["/players", false], ["/players_loan", true],
        ["/players_transfer", true], ["/payments", true], ["/expenses", true], ["/forms", true],
        ["/blog", true], ["/inbox", true], ["/outbox", false], ["/messages", true], ["/meetings", false],
        ["/members", false], ["/technicalApparatus", false], ["/requests", true], ["/assembly", false],
        ["/powers", false], ["/leagues", false], ["/stadiums", false],
    ],
};

// States behind a click, audited while open. Each step clicks the first visible
// control with that text (a tab, a filter, a button); a step whose control is
// missing — no request in the local data to open, say — is reported, not failed.
const STEPS = {
    "club:/tracking": [
        { name: "الكل", click: ["الكل"] },
        { name: "drawer", click: ["فتح المسار"] },
    ],
    "team:/tracking": [{ name: "drawer", click: ["تتبّع الطلب"] }],
    "club:/messages": [{ name: "compose", click: ["صندوق الصادر", "إضافة رسالة"] }],
    "team:/messages": [{ name: "compose", click: ["البريد الصادر", "إضافة رسالة"] }],
    "team:/outbox": [{ name: "compose", click: ["إضافة رسالة"] }],
};

const clickText = async (page, text) => {
    const candidates = [
        page.getByRole("button", { name: text, exact: true }),
        page.getByRole("tab", { name: text, exact: true }),
        page.getByText(text, { exact: true }),
    ];
    for (const locator of candidates) {
        const visible = locator.filter({ visible: true }).first();
        if (await visible.count()) {
            await visible.click({ timeout: 10000 });
            return true;
        }
    }
    return false;
};

// A finding of these kinds fails the run; the rest are reported only.
const FAILING = new Set([
    "leaked-value", "table-grid", "page-overflow", "covered", "overlap", "escapes-card",
    "busy-loop", "menu-clipped", "menu-empty", "page-error", "auth",
]);

// Share of the time the page's main thread stays busy while nobody touches it.
const BUSY_LIMIT = 0.5;
const busyShare = async (cdp, page, ms = 1500) => {
    const taskTime = async () => {
        const { metrics } = await cdp.send("Performance.getMetrics");
        return metrics.find((m) => m.name === "TaskDuration")?.value || 0;
    };
    const before = await taskTime();
    await page.waitForTimeout(ms);
    return ((await taskTime()) - before) / (ms / 1000);
};

// The page's own ⋮ menus: open the last one on the page (the first is the
// account menu in the header) and see that something usable appeared.
const auditLastMenu = async (page) => {
    const targets = page.locator('[aria-haspopup="menu"]:not([disabled])').filter({ visible: true });
    const count = await targets.count();
    if (count < 2) return [];
    const target = targets.nth(count - 1);
    await target.click({ timeout: 10000 });
    await page.waitForTimeout(400);
    const findings = await target.evaluate(auditOpenMenu);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    return findings;
};

const only = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const wanted = (appKey, path) => !only.length || only.includes(`${appKey}:${path}`) || only.includes(appKey);
const viewports = (process.env.VIEWPORTS || "desktop,phone").split(",").map((s) => s.trim());

const settle = async (page) => {
    await page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {});
    // Wait out loaders (Mantine dots/oval) the page shows while its data arrives.
    await page.waitForFunction(
        () => ![...document.querySelectorAll("[class*=Loader]")]
            .some((el) => el.getBoundingClientRect().width > 0),
        null, { timeout: 30000 },
    ).catch(() => {});
    // And out transitions: a drawer still sliding in overlaps everything it passes.
    await page.waitForFunction(
        () => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming?.().iterations === Infinity),
        null, { timeout: 10000 },
    ).catch(() => {});
    await page.waitForTimeout(600);
};

const shotName = (appKey, path, vp, step = "") =>
    `${appKey}${path === "/" ? "-home" : path.replace(/\//g, "-")}${step ? "-" + step : ""}-${vp}.png`;

const main = async () => {
    mkdirSync(OUT, { recursive: true });
    const browser = await chromium.launch();
    const report = [];

    for (const [appKey, app] of Object.entries(APPS)) {
        const pages = PAGES[appKey].filter(([path]) => wanted(appKey, path));
        if (!pages.length) continue;
        const token = await login(app);

        for (const vp of viewports) {
            const context = await browser.newContext({ viewport: VIEWPORTS[vp], locale: "ar" });
            await context.addInitScript((t) => localStorage.setItem("omkoora.auth.token", t), token);
            const page = await context.newPage();
            const cdp = await context.newCDPSession(page);
            await cdp.send("Performance.enable");

            let current = [];
            const record = ({ appKey: a, path: p, vp: v, recent: r, shot: s, started: t }) => {
                report.push({ app: a, path: p, viewport: v, recent: r, screenshot: s, findings: current });
                const mark = current.some((f) => FAILING.has(f.kind)) ? "✗" : "✓";
                console.log(`${mark} ${a}${p} [${v}]${r ? " ★" : ""} ${((Date.now() - t) / 1000).toFixed(1)}s`);
                current.forEach((f) => console.log(`    ${FAILING.has(f.kind) ? "✗" : "·"} ${f.kind}: ${f.detail}`));
            };
            page.on("pageerror", (error) => current.push({ kind: "page-error", detail: String(error.message).slice(0, 200) }));
            page.on("console", (msg) => {
                if (msg.type() === "error" && !/Failed to load resource|React does not recognize|Warning:/.test(msg.text())) {
                    current.push({ kind: "console-error", detail: msg.text().slice(0, 200) });
                }
            });
            page.on("response", async (res) => {
                if (!res.url().includes("/graphql") || res.request().method() !== "POST") return;
                try {
                    const body = await res.json();
                    const op = res.request().postDataJSON()?.operationName || "?";
                    (body?.errors || []).slice(0, 1).forEach((e) =>
                        current.push({ kind: "graphql-error", detail: `${op}: ${String(e.message).slice(0, 160)}` }));
                } catch { /* uploads and non-JSON replies */ }
            });

            for (const [path, recent] of pages) {
                current = [];
                const started = Date.now();
                await page.goto(app.url + path, { waitUntil: "domcontentloaded", timeout: 90000 });
                await settle(page);
                if (new URL(page.url()).pathname.startsWith("/login")) {
                    current.push({ kind: "auth", detail: "redirected to /login" });
                } else {
                    current.push(...await page.evaluate(auditPage));
                    const busy = await busyShare(cdp, page);
                    if (busy > BUSY_LIMIT) {
                        current.push({ kind: "busy-loop", detail: `الصفحة مشغولة ${Math.round(busy * 100)}% من الوقت وهي ساكنة` });
                    }
                    current.push(...await auditLastMenu(page).catch((error) =>
                        [{ kind: "menu-clipped", detail: `تعذّر فتح القائمة: ${String(error.message).slice(0, 80)}` }]));
                }
                const shot = shotName(appKey, path, vp);
                await page.screenshot({ path: join(OUT, shot), fullPage: true }).catch(() => {});

                record({ appKey, path, vp, recent, shot, started });

                for (const step of STEPS[`${appKey}:${path}`] || []) {
                    current = [];
                    const stepStarted = Date.now();
                    let reached = true;
                    for (const text of step.click) {
                        if (!(await clickText(page, text))) {
                            current.push({ kind: "step-missing", detail: `لا يوجد «${text}» للضغط` });
                            reached = false;
                            break;
                        }
                        await settle(page);
                    }
                    if (reached) current.push(...await page.evaluate(auditPage));
                    const stepShot = shotName(appKey, path, vp, step.name);
                    await page.screenshot({ path: join(OUT, stepShot), fullPage: true }).catch(() => {});
                    record({ appKey, path: `${path} → ${step.name}`, vp, recent, shot: stepShot, started: stepStarted });
                }
            }
            await context.close();
        }
    }

    await browser.close();
    writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
    const failed = report.filter((r) => r.findings.some((f) => FAILING.has(f.kind)));
    console.log(`\n${report.length - failed.length}/${report.length} pages clean — screenshots in e2e/output/`);
    process.exit(failed.length ? 1 : 0);
};

main().catch((error) => {
    console.error(error);
    process.exit(2);
});
