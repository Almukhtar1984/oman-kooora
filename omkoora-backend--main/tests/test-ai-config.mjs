#!/usr/bin/env node
/**
 * Unit tests for the AI integration (no server, no DB, no network).
 *
 * Covers the three things that must be correct no matter what the providers do
 * next year:
 *   1. Model ranking  — the "تحديث الموديلات" button must surface the popular,
 *      current chat models newest-first and drop embeddings/tts/image/etc.,
 *      while still letting unknown future chat models through (future-proof).
 *   2. Secret crypto  — API keys round-trip through AES-256-GCM, survive a
 *      different value, and fail closed (null) on tamper / wrong key.
 *   3. Masking        — never leaks more than a hint of a key.
 *
 *   node tests/test-ai-config.mjs
 */
// Set the encryption key BEFORE importing anything, because Secrets.mjs (pulled
// in transitively by ai.mjs) captures the key at module-load time. Imports are
// dynamic for the same reason — static imports are hoisted above this line.
process.env.AI_ENC_KEY = "unit-test-key-please-ignore";

const { AI_PROVIDERS, rankByPriority, rankOpenAIModels, rankGeminiModels } =
    await import("../src/Config/ai.mjs");
const { encryptSecret, decryptSecret, maskSecret, isEncryptionConfigured } =
    await import("../src/Helpers/Secrets.mjs");

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", dim: "\x1b[2m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};
const eq = (actual, expected, msg) =>
    assert(JSON.stringify(actual) === JSON.stringify(expected), `${msg} ${c.dim}(got ${JSON.stringify(actual)})${c.reset}`);
const ids = (ranked) => ranked.map((m) => m.id);

// ───────────────────────── 1. rankByPriority (pure core) ─────────────────────
{
    const out = rankByPriority(["z-model", "gpt-4o", "a-model", "gpt-4o-mini"], ["gpt-4o-mini", "gpt-4o"]);
    eq(ids(out), ["gpt-4o-mini", "gpt-4o", "a-model", "z-model"],
        "priority prefixes come first (in list order), the rest alphabetically");
    eq(out[0], { id: "gpt-4o-mini", recommended: true }, "only the first model is marked recommended");
    assert(out.slice(1).every((m) => m.recommended === false), "no other model is recommended");

    eq(ids(rankByPriority(["b", "a", "a", "b"], [])), ["a", "b"], "duplicates are collapsed; no-priority falls back to alpha");
    eq(rankByPriority([], ["gpt-4o"]), [], "empty input yields empty output");
    eq(rankByPriority(null, null), [], "null input is tolerated");
    eq(rankByPriority([null, "", "gpt-4o"], []).length, 1, "null/empty ids are dropped");

    const capped = rankByPriority(Array.from({ length: 50 }, (_, i) => `m${String(i).padStart(2, "0")}`), [], 12);
    assert(capped.length === 12, "the list is capped (default 12) so the dropdown stays usable");

    // A brand-new unknown chat model (not in the priority list) must still appear.
    const future = rankByPriority(["gpt-6-turbo", "gpt-4o"], ["gpt-4o"]);
    assert(future.some((m) => m.id === "gpt-6-turbo"), "an unknown future model still appears (after the known-popular ones)");
    eq(future[0].id, "gpt-4o", "...but a known-popular model is preferred/recommended over the unknown one");
}

// ───────────────────────── 2. rankOpenAIModels (filter) ──────────────────────
{
    const api = { data: [
        { id: "gpt-4o" }, { id: "gpt-4o-mini" }, { id: "o3-mini" }, { id: "chatgpt-4o-latest" },
        { id: "text-embedding-3-large" }, { id: "whisper-1" }, { id: "tts-1" }, { id: "dall-e-3" },
        { id: "omni-moderation-latest" }, { id: "gpt-4o-realtime-preview" }, { id: "gpt-4o-audio-preview" },
        { id: "babbage-002" }, { id: "davinci-002" }, { id: "gpt-3.5-turbo-instruct" },
        { id: "ft:gpt-4o:acme::abc" }, { id: "gpt-image-1" },
    ] };
    const out = ids(rankOpenAIModels(api));
    assert(out.includes("gpt-4o") && out.includes("gpt-4o-mini") && out.includes("o3-mini") && out.includes("chatgpt-4o-latest"),
        "OpenAI chat models are kept");
    const banned = ["text-embedding-3-large", "whisper-1", "tts-1", "dall-e-3", "omni-moderation-latest",
        "gpt-4o-realtime-preview", "gpt-4o-audio-preview", "babbage-002", "davinci-002",
        "gpt-3.5-turbo-instruct", "ft:gpt-4o:acme::abc", "gpt-image-1"];
    assert(banned.every((b) => !out.includes(b)), "embeddings/whisper/tts/image/realtime/audio/instruct/fine-tunes are dropped");
    eq(out[0], "gpt-4o-mini", "the most-used model (gpt-4o-mini) is first/recommended");
    eq(rankOpenAIModels({}), [], "a malformed OpenAI response yields no models (no crash)");
}

// ───────────────────────── 3. rankGeminiModels (filter) ──────────────────────
{
    const api = { models: [
        { name: "models/gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-1.5-pro",   supportedGenerationMethods: ["generateContent", "countTokens"] },
        { name: "models/gemini-1.5-flash", supportedGenerationMethods: ["generateContent"] },
        { name: "models/text-embedding-004", supportedGenerationMethods: ["embedContent"] },
        { name: "models/embedding-001",    supportedGenerationMethods: ["embedContent"] },
        { name: "models/aqa",              supportedGenerationMethods: ["generateAnswer"] },
        { name: "models/imagen-3.0",       supportedGenerationMethods: ["predict"] },
    ] };
    const out = ids(rankGeminiModels(api));
    assert(out.includes("gemini-2.0-flash") && out.includes("gemini-1.5-pro") && out.includes("gemini-1.5-flash"),
        "Gemini generateContent models are kept, with the models/ prefix stripped");
    assert(!out.some((id) => /embedding|aqa|imagen|text-embedding/.test(id)),
        "embeddings / aqa / imagen are dropped");
    assert(out.every((id) => !id.startsWith("models/")), "the models/ path prefix is stripped from ids");
    eq(out[0], "gemini-2.0-flash", "the most-used Gemini model is first/recommended");
    eq(rankGeminiModels({}), [], "a malformed Gemini response yields no models (no crash)");
}

// ───────────────────────── 4. providers constant ─────────────────────────────
eq(AI_PROVIDERS, ["openai", "gemini"], "exactly the two supported providers are exposed");

// ───────────────────────── 5. secret crypto round-trip ───────────────────────
{
    assert(isEncryptionConfigured(), "encryption reports configured when a key is present");

    const key = "sk-proj-abcdef0123456789XYZ";
    const enc = encryptSecret(key);
    assert(typeof enc === "string" && enc.startsWith("v1:"), "ciphertext is versioned (v1:…)");
    assert(!enc.includes(key), "ciphertext does not contain the plaintext key");
    eq(decryptSecret(enc), key, "decrypt(encrypt(x)) === x");

    const enc2 = encryptSecret(key);
    assert(enc2 !== enc, "a fresh IV makes the same key encrypt to different ciphertext");
    eq(decryptSecret(enc2), key, "...and both still decrypt back to the same key");

    eq(encryptSecret(""), null, "empty/absent secret encrypts to null (stored as 'no key')");
    eq(encryptSecret(null), null, "null secret encrypts to null");
    eq(decryptSecret(null), null, "decrypting null is null, not a throw");
    eq(decryptSecret("garbage-not-even-v1"), null, "decrypting junk fails closed (null)");

    // Tamper: flip the last data char → auth tag check must reject.
    const tampered = enc.slice(0, -1) + (enc.endsWith("A") ? "B" : "A");
    eq(decryptSecret(tampered), null, "a tampered ciphertext fails closed (null)");

    eq(maskSecret("sk-proj-abcdef0123456789XYZ"), "sk-…XYZ", "mask shows only a 3+3 hint");
    eq(maskSecret("short"), "••••", "a short secret is fully masked");
    eq(maskSecret(null), null, "masking nothing is null");
}

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
