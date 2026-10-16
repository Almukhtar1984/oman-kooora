#!/usr/bin/env node
/**
 * Unit tests for the AI news-editor prompt helper (no server, no DB, no network).
 *
 *   node tests/test-ai-news-draft.mjs
 */
import { NEWS_MODES, normalizeMode, buildNewsDraftPrompt } from "../src/Helpers/newsDraft.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", dim: "\x1b[2m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};
const eq = (a, b, msg) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg} ${c.dim}(got ${JSON.stringify(a)})${c.reset}`);

// ───────────────────────── modes ─────────────────────────────────────────────
eq(NEWS_MODES, ["draft", "reformulate", "improve"], "the three editor modes are exposed");
eq(normalizeMode("reformulate"), "reformulate", "a known mode passes through");
eq(normalizeMode("nonsense"), "draft", "an unknown mode falls back to draft");
eq(normalizeMode(undefined), "draft", "a missing mode falls back to draft");

// ───────────────────────── prompt building ───────────────────────────────────
{
    let threw = false; try { buildNewsDraftPrompt({ text: "   " }); } catch { threw = true; }
    assert(threw, "empty text throws");

    const draft = buildNewsDraftPrompt({ text: "فاز النصر على السيب", mode: "draft", category: "competitions" });
    assert(draft.system.includes("محرّر") && draft.system.includes("JSON"), "system sets the role and asks for JSON");
    assert(draft.system.includes("لا تختلق"), "system forbids fabrication");
    assert(draft.prompt.includes("اكتب خبرًا"), "draft mode instructs to write a full article");
    assert(draft.prompt.includes("فاز النصر على السيب"), "prompt carries the user's text");
    assert(draft.prompt.includes("مسابقات"), "category label (مسابقات) is included");
    assert(draft.prompt.includes("subject") && draft.prompt.includes("description"), "prompt specifies the JSON shape");

    assert(buildNewsDraftPrompt({ text: "x", mode: "reformulate" }).prompt.includes("أعد صياغة"),
        "reformulate mode instructs to rewrite while keeping the facts");
    assert(buildNewsDraftPrompt({ text: "x", mode: "improve" }).prompt.includes("حسّن"),
        "improve mode instructs to polish");

    // Unknown category simply omits the label (no leaking).
    const noCat = buildNewsDraftPrompt({ text: "x", category: "bogus" });
    assert(!noCat.prompt.includes("تصنيف الخبر"), "an unknown category is omitted, not leaked");
}

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
