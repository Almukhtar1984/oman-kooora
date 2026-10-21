#!/usr/bin/env node
/**
 * "إلغاء الربط" with an AI provider.
 *
 * The settings page could save and replace a key but never remove one. Dropping
 * the key alone is not enough: leaving the feature switched on while no provider
 * is linked would make every AI button fail instead of being plainly off.
 *
 * Pure unit check — no server, no DB.
 *
 *   node tests/test-ai-disconnect.mjs
 */
import { disconnectPatch } from "../src/Helpers/aiConnection.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};

const both = {
    active_provider: "openai", enabled: true,
    openai_api_key: "enc:aaa", openai_model: "gpt-4o-mini",
    gemini_api_key: "enc:bbb", gemini_model: "gemini-2.0-flash",
};
const onlyOpenai = {
    active_provider: "openai", enabled: true,
    openai_api_key: "enc:aaa", openai_model: "gpt-4o-mini",
    gemini_api_key: null, gemini_model: null,
};

// the key and its model always go
let p = disconnectPatch(both, "openai");
assert(p.openai_api_key === null && p.openai_model === null, "المفتاح والموديل يُمسحان للمزوّد المُلغى");
assert(!("gemini_api_key" in p) && !("gemini_model" in p), "المزوّد الآخر لا يُمَس");

// the other provider takes over when the active one is unlinked
assert(p.active_provider === "gemini", "المزوّد الآخر يصبح الفعّال عند إلغاء الفعّال");
assert(p.enabled === undefined, "الميزة تبقى مفعّلة ما دام هناك مزوّد مربوط");

// unlinking the provider that is not active changes nothing else
p = disconnectPatch(both, "gemini");
assert(p.active_provider === undefined, "إلغاء مزوّد غير فعّال لا يغيّر الفعّال");
assert(p.enabled === undefined, "ولا يُطفئ الميزة");

// the last provider: the feature must not stay on with nothing behind it
p = disconnectPatch(onlyOpenai, "openai");
assert(p.enabled === false, "إلغاء آخر مزوّد يُطفئ الميزة");
assert(p.active_provider === undefined, "ولا يحوّل لمزوّد غير مربوط");

// an empty key column counts as "not linked"
p = disconnectPatch({ ...onlyOpenai, gemini_api_key: "" }, "openai");
assert(p.enabled === false, "مفتاح فارغ نصّياً لا يُعدّ ربطاً");

// already disconnected / empty settings must not throw
p = disconnectPatch({ active_provider: "gemini", enabled: false }, "gemini");
assert(p.gemini_api_key === null && p.enabled === false, "إلغاء ربط غير موجود يمرّ بلا خطأ");
p = disconnectPatch(undefined, "openai");
assert(p.openai_api_key === null && p.enabled === false, "إعدادات مفقودة لا تُسقط العملية");

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
