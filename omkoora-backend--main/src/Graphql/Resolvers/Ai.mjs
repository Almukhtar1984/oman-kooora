import { ApolloError } from 'apollo-server-express';
import logger from "../../Config/logger.mjs";
import { AiSetting } from '../../Models/index.mjs';
import { encryptSecret, decryptSecret } from "../../Helpers/Secrets.mjs";
import { AI_PROVIDERS, fetchModels, testConnection } from "../../Config/ai.mjs";

const SUPER_ADMIN_ROLE = "1";

const requireSuperAdmin = (context) => {
    const u = context?.user;
    if (!context?.isAuth || !u) throw new ApolloError("يلزم تسجيل الدخول", "AUTH_REQUIRED");
    if (u.role !== SUPER_ADMIN_ROLE) throw new ApolloError("غير مصرّح: المالك (السوبر-أدمن) فقط", "FORBIDDEN");
    return u;
};

// Load-or-create the singleton settings row.
const getSettings = async () => {
    const [row] = await AiSetting.findOrCreate({ where: { id: "default" }, defaults: { id: "default" } });
    return row;
};

const keyFor = (s, provider) => decryptSecret(provider === "openai" ? s.openai_api_key : s.gemini_api_key);

export const resolvers = {
    Query: {
        aiSettings: async (obj, args, context) => {
            requireSuperAdmin(context);
            const s = await getSettings();
            return {
                active_provider: s.active_provider,
                enabled: s.enabled,
                openai_model: s.openai_model,
                gemini_model: s.gemini_model,
                openai_has_key: Boolean(s.openai_api_key),
                gemini_has_key: Boolean(s.gemini_api_key),
            };
        },

        aiAvailableModels: async (obj, { provider, apiKey }, context) => {
            requireSuperAdmin(context);
            if (!AI_PROVIDERS.includes(provider)) throw new ApolloError("مزوّد غير مدعوم", "BAD_PROVIDER");
            const s = await getSettings();
            const key = apiKey && apiKey.trim() ? apiKey.trim() : keyFor(s, provider);
            if (!key) throw new ApolloError("أدخل مفتاح الـAPI أولًا", "NO_API_KEY");
            try {
                return await fetchModels(provider, key);
            } catch (e) {
                logger.error(`aiAvailableModels(${provider}): ${e?.message}`);
                throw new ApolloError(e.message || "تعذّر جلب الموديلات", "AI_MODELS_FAILED");
            }
        },
    },

    Mutation: {
        saveAiSettings: async (obj, { content }, context) => {
            requireSuperAdmin(context);
            const s = await getSettings();
            const patch = {};

            if (content.active_provider !== undefined && content.active_provider !== null) {
                if (!AI_PROVIDERS.includes(content.active_provider)) throw new ApolloError("مزوّد غير مدعوم", "BAD_PROVIDER");
                patch.active_provider = content.active_provider;
            }
            if (content.enabled !== undefined && content.enabled !== null) {
                patch.enabled = Boolean(content.enabled);
            }
            // Per-provider key/model update.
            if (content.provider) {
                if (!AI_PROVIDERS.includes(content.provider)) throw new ApolloError("مزوّد غير مدعوم", "BAD_PROVIDER");
                if (content.apiKey && content.apiKey.trim()) {
                    patch[`${content.provider}_api_key`] = encryptSecret(content.apiKey.trim());
                }
                if (content.model !== undefined && content.model !== null && content.model !== "") {
                    patch[`${content.provider}_model`] = content.model;
                }
            }

            try {
                await s.update(patch);
                return { status: true };
            } catch (e) {
                logger.error(`saveAiSettings: ${e?.message}`);
                throw new ApolloError(e.message || "فشل الحفظ", "AI_SAVE_FAILED");
            }
        },

        testAiConnection: async (obj, { provider, apiKey }, context) => {
            requireSuperAdmin(context);
            if (!AI_PROVIDERS.includes(provider)) throw new ApolloError("مزوّد غير مدعوم", "BAD_PROVIDER");
            const s = await getSettings();
            const key = apiKey && apiKey.trim() ? apiKey.trim() : keyFor(s, provider);
            if (!key) return { ok: false, message: "لا يوجد مفتاح للاختبار", models: [] };
            return await testConnection(provider, key);
        },
    },
};
