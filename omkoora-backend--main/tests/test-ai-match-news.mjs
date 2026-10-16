#!/usr/bin/env node
/**
 * Unit tests for the match-result news helpers (no server, no DB, no network).
 *
 *   node tests/test-ai-match-news.mjs
 */
import {
    stageLabelAr, resultLineAr, buildMatchNewsPrompt, parseNewsJSON, NEWS_LIMITS,
} from "../src/Helpers/matchNews.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", dim: "\x1b[2m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};
const eq = (a, b, msg) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg} ${c.dim}(got ${JSON.stringify(a)})${c.reset}`);

// ───────────────────────── stage labels ──────────────────────────────────────
eq(stageLabelAr("final"), "النهائي", "final → النهائي");
eq(stageLabelAr("semi-finals"), "نصف النهائي", "semi-finals → نصف النهائي");
eq(stageLabelAr("groups"), "دور المجموعات", "groups → دور المجموعات");
eq(stageLabelAr("unknown-x"), "", "unknown stage → empty string");

// ───────────────────────── result line ───────────────────────────────────────
assert(resultLineAr({ teamA: "النصر", teamB: "السيب", goalsA: 3, goalsB: 1 }).includes("فوز النصر"), "home win names the winner");
assert(resultLineAr({ teamA: "النصر", teamB: "السيب", goalsA: 0, goalsB: 2 }).includes("فوز السيب"), "away win names the winner");
assert(resultLineAr({ teamA: "النصر", teamB: "السيب", goalsA: 2, goalsB: 2 }).startsWith("تعادل"), "equal scores → تعادل");

// ───────────────────────── prompt building ───────────────────────────────────
{
    const facts = {
        league: "دوري عُمان", stage: "النهائي", teamA: "النصر", teamB: "السيب",
        goalsA: 2, goalsB: 1, venue: "استاد السيب", date: "2026-10-16",
        manOfMatch: "سالم العامري",
        scorers: [{ player: "سالم العامري", team: "النصر", time: "23" }, { player: "خالد", team: "السيب", time: "70" }],
        note: "",
    };
    const { system, prompt } = buildMatchNewsPrompt(facts);
    assert(system.includes("محرّر رياضي") && system.includes("JSON"), "system prompt sets the role and asks for JSON");
    assert(system.includes("لا تختلق"), "system prompt forbids fabrication");
    assert(prompt.includes("النصر") && prompt.includes("السيب"), "prompt carries both team names");
    assert(prompt.includes("2 - 1") || prompt.includes("2-1"), "prompt carries the score");
    assert(prompt.includes("النهائي") && prompt.includes("دوري عُمان"), "prompt carries stage + league");
    assert(prompt.includes("سالم العامري"), "prompt carries scorer / man of the match");
    assert(prompt.includes("subject") && prompt.includes("short_description") && prompt.includes("description"),
        "prompt specifies the JSON shape to return");
}
{
    // Optional fields are simply omitted (no "undefined"/"null" leaking in).
    const { prompt } = buildMatchNewsPrompt({ teamA: "أ", teamB: "ب", goalsA: 0, goalsB: 0 });
    assert(!/undefined|null/.test(prompt), "missing optional facts don't leak undefined/null into the prompt");
    assert(prompt.includes("تعادل"), "a 0-0 is described as a draw");
}

// ───────────────────────── JSON parsing (robust) ─────────────────────────────
{
    const good = '{"subject":"عنوان","short_description":"ملخص","description":"نص الخبر الكامل هنا"}';
    eq(parseNewsJSON(good), { subject: "عنوان", short_description: "ملخص", description: "نص الخبر الكامل هنا" },
        "parses clean JSON");

    const fenced = "```json\n{\"subject\":\"ع\",\"short_description\":\"م\",\"description\":\"خبر\"}\n```";
    eq(parseNewsJSON(fenced).subject, "ع", "strips a ```json code fence");

    const chatter = 'طبعًا، إليك الخبر:\n{"subject":"ع","short_description":"م","description":"خبر"} انتهى.';
    eq(parseNewsJSON(chatter).description, "خبر", "ignores leading/trailing chatter around the JSON");

    // Alternate key names map through.
    eq(parseNewsJSON('{"title":"ع","summary":"م","body":"خبر"}').subject, "ع", "maps title/summary/body aliases");

    // short_description falls back to subject when absent.
    eq(parseNewsJSON('{"subject":"ع","description":"خبر"}').short_description, "ع",
        "short_description falls back to the subject when missing");

    // Failures throw rather than return junk.
    let threw = false; try { parseNewsJSON("not json at all"); } catch { threw = true; }
    assert(threw, "non-JSON input throws");
    threw = false; try { parseNewsJSON('{"short_description":"م"}'); } catch { threw = true; }
    assert(threw, "missing subject/description throws");
    threw = false; try { parseNewsJSON(""); } catch { threw = true; }
    assert(threw, "empty input throws");

    // Over-long fields are clamped to the Blog column limits.
    const longDesc = "ن".repeat(2000);
    const out = parseNewsJSON(JSON.stringify({ subject: "ع", short_description: "م", description: longDesc }));
    assert(out.description.length <= NEWS_LIMITS.description, "description is clamped to the column limit");
    assert(out.description.endsWith("…"), "a clamped field is marked with an ellipsis");
}

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
