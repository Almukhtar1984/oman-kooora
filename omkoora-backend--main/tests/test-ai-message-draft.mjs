#!/usr/bin/env node
/**
 * Unit tests for the AI message-draft helpers (no server, no DB, no network).
 *
 *   node tests/test-ai-message-draft.mjs
 */
import {
    MESSAGE_TONES, normalizeTone, buildMessageDraftPrompt, parseMessageJSON, MESSAGE_LIMITS,
} from "../src/Helpers/messageDraft.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", dim: "\x1b[2m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};
const eq = (a, b, msg) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg} ${c.dim}(got ${JSON.stringify(a)})${c.reset}`);

// ───────────────────────── tones ─────────────────────────────────────────────
eq(MESSAGE_TONES, ["formal", "friendly", "firm"], "the three tones are exposed");
eq(normalizeTone("firm"), "firm", "a known tone passes through");
eq(normalizeTone("whatever"), "formal", "an unknown tone falls back to formal");

// ───────────────────────── prompt building ───────────────────────────────────
{
    let threw = false; try { buildMessageDraftPrompt({ brief: "  " }); } catch { threw = true; }
    assert(threw, "empty brief throws");

    const p = buildMessageDraftPrompt({ brief: "دعوة لحضور اجتماع", tone: "formal", recipientType: "club", recipientName: "نادي النصر" });
    assert(p.system.includes("مراسلات") && p.system.includes("JSON"), "system sets the role and asks for JSON");
    assert(p.system.includes("لا تختلق"), "system forbids fabrication");
    assert(p.prompt.includes("دعوة لحضور اجتماع"), "prompt carries the brief");
    assert(p.prompt.includes("النادي") && p.prompt.includes("نادي النصر"), "prompt names the recipient type + name");
    assert(p.prompt.includes("subject") && p.prompt.includes("content"), "prompt specifies the JSON shape");

    const team = buildMessageDraftPrompt({ brief: "x", recipientType: "team" });
    assert(team.prompt.includes("الفريق"), "team recipient is labelled الفريق");
    assert(!/undefined|null/.test(team.prompt), "missing recipient name doesn't leak undefined/null");
}

// ───────────────────────── JSON parsing ──────────────────────────────────────
{
    eq(parseMessageJSON('{"subject":"دعوة","content":"نص الرسالة"}'), { subject: "دعوة", content: "نص الرسالة" },
        "parses clean JSON");
    eq(parseMessageJSON("```json\n{\"subject\":\"ع\",\"content\":\"ن\"}\n```").subject, "ع", "strips a ```json fence");
    eq(parseMessageJSON('تفضل:\n{"subject":"ع","content":"ن"} شكراً').content, "ن", "ignores chatter around the JSON");
    eq(parseMessageJSON('{"title":"ع","body":"ن"}').subject, "ع", "maps title/body aliases");

    let threw = false; try { parseMessageJSON('{"subject":"ع"}'); } catch { threw = true; }
    assert(threw, "missing content throws");
    threw = false; try { parseMessageJSON("nope"); } catch { threw = true; }
    assert(threw, "non-JSON throws");

    const longContent = "ن".repeat(2000);
    const out = parseMessageJSON(JSON.stringify({ subject: "ع", content: longContent }));
    assert(out.content.length <= MESSAGE_LIMITS.content, "content is clamped to the column limit");
}

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
