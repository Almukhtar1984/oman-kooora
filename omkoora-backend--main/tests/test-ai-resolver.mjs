#!/usr/bin/env node
/**
 * Resolver-guard + secrecy tests for the AI connection resolvers (no network).
 *
 * The security contract:
 *   • Only the super-admin (role "1") may read/change AI settings or test a key.
 *   • The stored API keys are NEVER returned to the client — aiSettings exposes
 *     only openai_has_key / gemini_has_key booleans.
 *   • saveAiSettings stores the key ENCRYPTED (never the plaintext).
 *
 * DB_SYNC is off, so importing the models defines them without connecting; the
 * guard rejects non-super-admins before any query runs. For the super-admin
 * happy path we stub AiSetting.findOrCreate (same singleton object the resolver
 * imports) so no real DB is touched.
 *
 *   node tests/test-ai-resolver.mjs
 */
process.env.AI_ENC_KEY = "unit-test-key-please-ignore";

const { resolvers } = await import("../src/Graphql/Resolvers/Ai.mjs");
const { AiSetting, Match } = await import("../src/Models/index.mjs");
const { decryptSecret } = await import("../src/Helpers/Secrets.mjs");

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", dim: "\x1b[2m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};
const eq = (a, b, msg) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg} ${c.dim}(got ${JSON.stringify(a)})${c.reset}`);

// Expect an async resolver to reject with a given GraphQL error code.
const rejects = async (fn, code, msg) => {
    try { await fn(); assert(false, `${msg} — expected to throw ${code} but resolved`); }
    catch (e) { assert(e?.extensions?.code === code || e?.code === code, `${msg} ${c.dim}(threw ${e?.extensions?.code || e?.code || e?.message})${c.reset}`); }
};

const ctx = (role) => (role ? { isAuth: true, user: { id: 1, role } } : { isAuth: false, user: null });
const Q = resolvers.Query;
const M = resolvers.Mutation;

// ───────────────── guards: only super-admin (role "1") ──────────────────────
await rejects(() => Q.aiSettings({}, {}, ctx(null)), "AUTH_REQUIRED", "aiSettings rejects an unauthenticated caller");
await rejects(() => Q.aiSettings({}, {}, ctx("2")), "FORBIDDEN", "aiSettings rejects a club admin (role 2)");
await rejects(() => Q.aiSettings({}, {}, ctx("6")), "FORBIDDEN", "aiSettings rejects a stadium owner (role 6)");
await rejects(() => Q.aiAvailableModels({}, { provider: "openai" }, ctx("3")), "FORBIDDEN", "aiAvailableModels rejects a team admin");
await rejects(() => M.saveAiSettings({}, { content: { enabled: true } }, ctx("4")), "FORBIDDEN", "saveAiSettings rejects a league admin");
await rejects(() => M.testAiConnection({}, { provider: "openai" }, ctx("5")), "FORBIDDEN", "testAiConnection rejects a match official");

// ───────────────── super-admin happy path (stubbed store) ───────────────────
// A fake settings row that records what update() was asked to persist.
const makeRow = (seed = {}) => {
    const row = {
        id: "default", active_provider: "gemini", enabled: false,
        openai_api_key: null, openai_model: null, gemini_api_key: null, gemini_model: null,
        ...seed,
        async update(patch) { Object.assign(this, patch); this._lastPatch = patch; return this; },
    };
    return row;
};
let current = makeRow();
AiSetting.findOrCreate = async () => [current]; // same object the resolver imports

// aiSettings must expose has_key booleans and NEVER the key strings.
current = makeRow({ openai_api_key: "v1:enc:enc:enc", openai_model: "gpt-4o-mini", active_provider: "openai", enabled: true });
const view = await Q.aiSettings({}, {}, ctx("1"));
eq(Object.keys(view).sort(),
   ["active_provider", "enabled", "gemini_has_key", "gemini_model", "openai_has_key", "openai_model"],
   "aiSettings returns only non-secret fields (no *_api_key keys in the object)");
assert(!("openai_api_key" in view) && !("gemini_api_key" in view), "the raw key fields are absent from the response");
eq(view.openai_has_key, true, "openai_has_key is true when a key is stored");
eq(view.gemini_has_key, false, "gemini_has_key is false when no key is stored");
eq(view.active_provider, "openai", "active_provider is reported");
eq(view.enabled, true, "enabled is reported");

// saveAiSettings must ENCRYPT the key — never persist the plaintext.
current = makeRow();
const PLAIN = "sk-super-secret-value-123456";
await M.saveAiSettings({}, { content: { provider: "openai", apiKey: PLAIN, model: "gpt-4o-mini", active_provider: "openai", enabled: true } }, ctx("1"));
assert(current.openai_api_key && current.openai_api_key.startsWith("v1:"), "saveAiSettings stores a versioned ciphertext for the key");
assert(current.openai_api_key !== PLAIN && !current.openai_api_key.includes(PLAIN), "the plaintext key is never stored");
eq(decryptSecret(current.openai_api_key), PLAIN, "the stored ciphertext decrypts back to the given key");
eq(current.openai_model, "gpt-4o-mini", "the model is stored for the right provider");
eq(current.active_provider, "openai", "active_provider is updated");
eq(current.enabled, true, "enabled is updated");

// Omitting apiKey keeps the existing key (edit settings without re-entering it).
current = makeRow({ openai_api_key: "v1:keep:keep:keep" });
await M.saveAiSettings({}, { content: { provider: "openai", model: "gpt-4o" } }, ctx("1"));
eq(current.openai_api_key, "v1:keep:keep:keep", "omitting apiKey keeps the current key");
eq(current.openai_model, "gpt-4o", "...while still updating the model");

// Bad provider is rejected.
await rejects(() => M.saveAiSettings({}, { content: { active_provider: "anthropic" } }, ctx("1")), "BAD_PROVIDER",
    "saveAiSettings rejects an unsupported active_provider");
await rejects(() => Q.aiAvailableModels({}, { provider: "anthropic" }, ctx("1")), "BAD_PROVIDER",
    "aiAvailableModels rejects an unsupported provider");

// testAiConnection with no stored key and no supplied key short-circuits (no network).
current = makeRow();
const res = await M.testAiConnection({}, { provider: "openai" }, ctx("1"));
eq(res.ok, false, "testAiConnection returns ok:false when there is no key (and makes no network call)");
assert(Array.isArray(res.models) && res.models.length === 0, "...with an empty models list");

// aiAvailableModels with no key at all is a clean error, not a crash.
await rejects(() => Q.aiAvailableModels({}, { provider: "gemini" }, ctx("1")), "NO_API_KEY",
    "aiAvailableModels asks for a key when none is stored or supplied");

// ───────────────── generateMatchNews: role gate + wiring ────────────────────
// Content action — only super-admin (1) and league admin (4) may trigger it.
await rejects(() => M.generateMatchNews({}, { id_match: "m1" }, ctx(null)), "AUTH_REQUIRED",
    "generateMatchNews rejects an unauthenticated caller");
await rejects(() => M.generateMatchNews({}, { id_match: "m1" }, ctx("2")), "FORBIDDEN",
    "generateMatchNews rejects a club admin (role 2)");
await rejects(() => M.generateMatchNews({}, { id_match: "m1" }, ctx("3")), "FORBIDDEN",
    "generateMatchNews rejects a team admin (role 3)");
await rejects(() => M.generateMatchNews({}, { id_match: "m1" }, ctx("6")), "FORBIDDEN",
    "generateMatchNews rejects a stadium owner (role 6)");

// An authorized role passes the guard and proceeds to gather the match — stub
// Match.findByPk to return nothing so we hit MATCH_NOT_FOUND (proves the guard
// let role 4/1 through, without needing a real AI key).
Match.findByPk = async () => null;
await rejects(() => M.generateMatchNews({}, { id_match: "nope" }, ctx("4")), "MATCH_NOT_FOUND",
    "a league admin (role 4) passes the guard and reaches match lookup");
await rejects(() => M.generateMatchNews({}, { id_match: "nope" }, ctx("1")), "MATCH_NOT_FOUND",
    "the super-admin (role 1) also passes the guard");

// ───────────────── draftNews: role gate + input guard ───────────────────────
await rejects(() => M.draftNews({}, { content: { text: "x" } }, ctx(null)), "AUTH_REQUIRED",
    "draftNews rejects an unauthenticated caller");
await rejects(() => M.draftNews({}, { content: { text: "x" } }, ctx("2")), "FORBIDDEN",
    "draftNews rejects a club admin (role 2)");
await rejects(() => M.draftNews({}, { content: { text: "   " } }, ctx("1")), "TEXT_REQUIRED",
    "draftNews requires non-empty text (after the guard passes)");

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
