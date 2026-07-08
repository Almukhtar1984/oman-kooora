#!/usr/bin/env node
/**
 * Guards for the player-card operations in the team app: card printing plus the
 * full action menu (edit, image, attachments, stats, classification, free,
 * loan, transfer, verify, delete). Repeatedly in this codebase an action's
 * handler prop existed but nothing was wired to call it, or a modal was never
 * mounted — so the button did nothing. These static guards lock the wiring
 * end to end: menu item -> handler prop -> mounted modal / helper.
 *
 * The print-app rendering states (loading / not-found / error) are covered by
 * the print app's own vitest suite (Card.test.tsx).
 *
 *   node tests/test-player-card-actions.mjs
 */

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", cyan: "\x1b[36m" };
const ok  = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}✗${c.reset} ${m}`);
let failures = 0;
const assert = (cond, msg) => { if (cond) ok(msg); else { bad(msg); failures++; } };

const root = resolve(__dirname, "..", "..");
const read = (...p) => { try { return readFileSync(resolve(root, ...p), "utf8"); } catch { return ""; } };
const TEAM = "client/omkoora-team--main";

// ── Card printing (openPrint helper) ─────────────────────────────────────────
console.log(`${c.cyan}▶ Card printing — openPrint helper${c.reset}`);
{
    const op = read(TEAM, "lib", "helpers", "openPrint.ts");
    assert(op !== "", "openPrint.ts exists");
    assert(/fetchPrintToken\(\)/.test(op), "fetches a short-lived print token");
    assert(/apollo-require-preflight/.test(op), "sends the CSRF preflight header for the token request");
    assert(/window\.open\(""/.test(op), "opens the print tab within the click gesture");
    assert(/\$\{PRINT_BASE\}\/#\$\{normalized\}/.test(op), "builds a hash-router print URL");
    assert(/token=\$\{encodeURIComponent\(token\)\}/.test(op), "carries the token in the URL when present");
    assert(/firstSegment === "undefined"|firstSegment === "null"/.test(op),
        "guards against opening the print tab with a missing id");
}

// ── Print app shows a real terminal state (no endless spinner) ───────────────
console.log(`${c.cyan}▶ Print app — no endless loading${c.reset}`);
{
    const card = read("client", "print", "src", "components", "PDF", "Card.tsx");
    assert(/print-card-notfound/.test(card), "print card has a not-found state");
    assert(/print-card-error/.test(card), "print card has an error state");
    const app = read("client", "print", "src", "App.tsx");
    assert(/loading, error, called/.test(app) || /error, called/.test(app),
        "App.tsx reads the query lifecycle");
    assert(/loaded=\{called && !loading\}/.test(app), "App.tsx passes a finished flag to the card");
}

// ── Every card action is wired: menu item -> handler ─────────────────────────
console.log(`${c.cyan}▶ MemberCard action menu invokes each handler${c.reset}`);
{
    const card = read(TEAM, "components", "Card", "MemberCard.tsx");
    assert(card !== "", "MemberCard.tsx exists");
    const wired = [
        ["تعديل", /onEdit && onEdit\(data\)/],
        ["إضافة صورة", /onAddImage && onAddImage\(/],
        ["إضافة مرفقات", /onAddAttachment && onAddAttachment\(data\?\.id\)/],
        ["المرفقات", /onShowAttachments && onShowAttachments\(data\)/],
        ["احصائيات اللاعب", /onStatPlayer && onStatPlayer\(/],
        ["تغيير التصنيف", /onChangeClassification && onChangeClassification\(data\)/],
        ["تحرير اللاعب", /onFreePlayer && onFreePlayer\(data\?\.id\)/],
        ["إعارة اللاعب", /onLoanPlayer && onLoanPlayer\(data\)/],
        ["تحقق", /onVerifyIdentity && onVerifyIdentity\(data\)/],
        ["حذف", /onDelete && onDelete\(data\?\.id\)/],
        ["طباعة البطاقة", /openPrint\(`\/\$\{data\?\.id\}`\)/],
    ];
    for (const [label, re] of wired) {
        assert(re.test(card), `menu item "${label}" calls its handler`);
    }
    assert(/import \{ openPrint \}/.test(card), "MemberCard imports openPrint");

    // Clicking the card body opens the details modal (same as the eye icon),
    // and the action buttons stop propagation so the menu doesn't also open it.
    assert(/<Box onClick=\{\(\) => setDetailsOpen\(true\)\}/.test(card),
        "card body opens the details modal on click");
    assert(/onClick=\{\(e\) => e\.stopPropagation\(\)\}/.test(card),
        "action buttons stopPropagation so the menu doesn't open details");
}

// ── Every handler is fed a real modal on the page that renders the cards ──────
console.log(`${c.cyan}▶ Home page wires handlers + mounts modals${c.reset}`);
{
    const home = read(TEAM, "pages", "index.tsx");
    assert(home !== "", "index.tsx exists");

    const handlers = [
        "onEdit", "onDelete", "onChangeStatus", "onChangeClassification", "onVerifyIdentity",
        "onAddAttachment", "onStatPlayer", "onTransferPlayer", "onLoanPlayer", "onFreePlayer", "onAddImage",
    ];
    for (const h of handlers) {
        assert(new RegExp(`${h}=\\{`).test(home), `passes ${h} to the card`);
    }

    const modals = [
        "UpdatePlayersModal", "ChangeStatusPlayersModal", "ChangeClassificationModal",
        "VerifyIdentityModal", "AddAttachmentPlayerModal", "PlayersTransferModal",
        "PlayersLoanModal", "FreePlayerModal", "AddImagePlayersModal",
    ];
    for (const m of modals) {
        assert(new RegExp(`<${m}[\\s>]`).test(home), `mounts <${m} />`);
    }
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All player-card-action guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} player-card-action guard(s) failed.${c.reset}`);
    process.exit(1);
}
