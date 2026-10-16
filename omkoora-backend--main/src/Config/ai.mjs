// AI provider abstraction for text generation (news drafting, match-result
// news, message drafting). Two providers: OpenAI (ChatGPT) and Google Gemini.
// The owner connects a key from the super-admin dashboard; it is stored
// encrypted and never returned to the client. Generation runs on the provider's
// servers (one outbound HTTPS call) — no load on our server.
import logger from "./logger.mjs";
import { decryptSecret } from "../Helpers/Secrets.mjs";

export const AI_PROVIDERS = ["openai", "gemini"];

// Curated "most popular / most used" families, newest-first. Live models that
// match these prefixes surface first; any other valid chat model still appears
// after them, so the list stays current without dumping embeddings/tts/etc.
const OPENAI_PRIORITY = [
    "gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "gpt-4-turbo",
    "o4-mini", "o3-mini", "o3", "o1-mini", "o1", "gpt-3.5-turbo",
];
const GEMINI_PRIORITY = [
    "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash",
    "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-2.5-pro",
];

// OpenAI /models returns everything (embeddings, tts, whisper, image, …). Keep
// only text chat/completion models suitable for drafting.
const OPENAI_EXCLUDE = /embedding|whisper|tts|audio|realtime|transcribe|dall-e|moderation|image|search|babbage|davinci|\binstruct\b|^ft:/i;
const isOpenAIChat = (id) => !OPENAI_EXCLUDE.test(id) && (/^gpt-/i.test(id) || /^o[1-9]/i.test(id) || /^chatgpt-/i.test(id));

const GEMINI_EXCLUDE = /embedding|aqa|-tuning|imagen|\bvision\b/i;

// Order ids by a priority list (prefix match), then the remainder alphabetically,
// capped. Returns [{ id, recommended }]. Pure + deterministic (unit-tested).
export const rankByPriority = (ids, priority, cap = 12) => {
    const uniq = [...new Set((ids || []).filter(Boolean))];
    const picked = [];
    const used = new Set();
    for (const p of (priority || [])) {
        for (const id of uniq) {
            if (!used.has(id) && id.toLowerCase().startsWith(p.toLowerCase())) {
                picked.push(id); used.add(id);
            }
        }
    }
    const rest = uniq.filter((id) => !used.has(id)).sort();
    const ordered = [...picked, ...rest].slice(0, cap);
    return ordered.map((id, i) => ({ id, recommended: i === 0 }));
};

// Pure filters (unit-tested) — take a raw provider response, return ranked models.
export const rankOpenAIModels = (apiData) => {
    const ids = (apiData?.data || []).map((m) => m.id).filter(isOpenAIChat);
    return rankByPriority(ids, OPENAI_PRIORITY);
};
export const rankGeminiModels = (apiData) => {
    const ids = (apiData?.models || [])
        .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
        .map((m) => String(m.name || "").replace(/^models\//, ""))
        .filter((id) => /gemini/i.test(id) && !GEMINI_EXCLUDE.test(id));
    return rankByPriority(ids, GEMINI_PRIORITY);
};

const timeout = (ms) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); return { signal: c.signal, done: () => clearTimeout(t) }; };

// Fetch the latest available models from the provider, filtered + ranked.
export const fetchModels = async (provider, apiKey) => {
    if (!AI_PROVIDERS.includes(provider)) throw new Error("مزوّد غير مدعوم");
    if (!apiKey) throw new Error("مفتاح الـAPI مطلوب");
    const t = timeout(15000);
    try {
        if (provider === "openai") {
            const res = await fetch("https://api.openai.com/v1/models", {
                headers: { Authorization: `Bearer ${apiKey}` }, signal: t.signal,
            });
            if (!res.ok) throw new Error(`OpenAI: ${res.status} ${await safeText(res)}`);
            return rankOpenAIModels(await res.json());
        } else {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`, { signal: t.signal });
            if (!res.ok) throw new Error(`Gemini: ${res.status} ${await safeText(res)}`);
            return rankGeminiModels(await res.json());
        }
    } finally { t.done(); }
};

// A tiny call to confirm the key works. Returns { ok, message, models }.
export const testConnection = async (provider, apiKey) => {
    try {
        const models = await fetchModels(provider, apiKey);
        if (!models.length) return { ok: false, message: "تم الاتصال لكن لا توجد موديلات متاحة", models: [] };
        return { ok: true, message: "تم الاتصال بنجاح", models };
    } catch (e) {
        return { ok: false, message: e.message || "فشل الاتصال", models: [] };
    }
};

// Generate text with the active, enabled provider from ai_settings.
// Returns the generated string. Throws a friendly error if not configured.
export const generateText = async ({ prompt, system } = {}) => {
    const { AiSetting } = await import("../Models/index.mjs");
    const s = await AiSetting.findByPk("default");
    if (!s || !s.enabled) throw new Error("ميزة الذكاء الاصطناعي غير مفعّلة");
    const provider = s.active_provider;
    const apiKey = decryptSecret(provider === "openai" ? s.openai_api_key : s.gemini_api_key);
    const model = provider === "openai" ? s.openai_model : s.gemini_model;
    if (!apiKey || !model) throw new Error("لم يتم ضبط مفتاح/موديل الذكاء الاصطناعي");

    const t = timeout(30000);
    try {
        if (provider === "openai") {
            const messages = [];
            if (system) messages.push({ role: "system", content: system });
            messages.push({ role: "user", content: prompt });
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model, messages, temperature: 0.7 }),
                signal: t.signal,
            });
            if (!res.ok) throw new Error(`OpenAI: ${res.status} ${await safeText(res)}`);
            const d = await res.json();
            return d?.choices?.[0]?.message?.content?.trim() || "";
        } else {
            const body = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
            };
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: t.signal,
            });
            if (!res.ok) throw new Error(`Gemini: ${res.status} ${await safeText(res)}`);
            const d = await res.json();
            return (d?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
        }
    } catch (e) {
        logger.error(`AI generateText failed: ${e?.message}`);
        throw new Error(e.message || "فشل توليد النص");
    } finally { t.done(); }
};

const safeText = async (res) => { try { return (await res.text()).slice(0, 200); } catch { return ""; } };
