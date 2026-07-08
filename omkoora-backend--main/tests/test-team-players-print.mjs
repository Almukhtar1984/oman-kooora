#!/usr/bin/env node
/**
 * Guards for the "طباعة لاعبين" option on the team app's competitions list.
 *
 * The option must open the team's players for that competition through the
 * OPTIMIZED print route (team-cards -> LeagueCards -> usePrintAssets), which
 * compresses the photos and shows a "preparing" progress screen so the PDF is
 * ready quickly. The image compression itself is behaviourally covered by the
 * print app's usePrintAssets.test.tsx (vitest).
 *
 *   node tests/test-team-players-print.mjs
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
const PRINT = "client/print";

console.log(`${c.cyan}▶ "طباعة لاعبين" option is wired (table + card)${c.reset}`);
{
    const table = read(TEAM, "components", "Tables", "Leagues.tsx");
    assert(/import \{ openPrint \}/.test(table), "Leagues table imports openPrint");
    assert(/طباعة لاعبين/.test(table), "Leagues table has the print-players menu item");
    assert(/openPrint\(`\/team-cards\/\$\{team\.id\}\/all`\)/.test(table),
        "table option opens the team's players via the team-cards route");

    const card = read(TEAM, "components", "Card", "LeagueCard.tsx");
    assert(/import \{ openPrint \}/.test(card), "LeagueCard imports openPrint");
    assert(/طباعة لاعبين/.test(card) && /openPrint\(`\/team-cards\/\$\{team\.id\}\/all`\)/.test(card),
        "mobile card has the same print-players option");
}

console.log(`${c.cyan}▶ team-cards uses the FAST/optimized print path${c.reset}`);
{
    const route = read(PRINT, "src", "TeamPlayersCards.tsx");
    assert(/LeagueCards/.test(route), "team-cards route renders LeagueCards");

    const cards = read(PRINT, "src", "components", "PDF", "LeagueCards.tsx");
    assert(/usePrintAssets/.test(cards), "LeagueCards uses usePrintAssets (image compression)");
    assert(/PrintProgress/.test(cards), "LeagueCards shows a preparing/progress screen");
    assert(/!progress\.ready/.test(cards), "it waits for assets before rendering the PDF");
    assert(/deferViewerAbove/.test(cards), "large lists are deferred so they stay responsive");
}

console.log(`${c.cyan}▶ usePrintAssets actually shrinks the photos${c.reset}`);
{
    const hook = read(PRINT, "src", "hooks", "usePrintAssets.ts");
    assert(hook !== "", "usePrintAssets exists");
    assert(/createImageBitmap|OffscreenCanvas|drawImage|canvas/i.test(hook),
        "downscales images via canvas/bitmap (not the raw DSLR file)");
    assert(/toBlob|toDataURL|convertToBlob/.test(hook), "re-encodes the resized image");
    assert(/progress/i.test(hook) && /ready/.test(hook), "reports load progress + a ready flag");
}

console.log("");
if (failures === 0) {
    console.log(`${c.green}All team-players-print guards passed.${c.reset}`);
    process.exit(0);
} else {
    console.log(`${c.red}${failures} team-players-print guard(s) failed.${c.reset}`);
    process.exit(1);
}
