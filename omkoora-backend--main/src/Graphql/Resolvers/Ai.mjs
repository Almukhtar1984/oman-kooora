import { ApolloError } from 'apollo-server-express';
import logger from "../../Config/logger.mjs";
import {
    AiSetting, Match, ParticipatingTeams, Team, League, ScorerMatch,
    ParticipatingPlayers, Players, Person, Blog,
} from '../../Models/index.mjs';
import { encryptSecret, decryptSecret } from "../../Helpers/Secrets.mjs";
import { AI_PROVIDERS, fetchModels, testConnection, generateText } from "../../Config/ai.mjs";
import { stageLabelAr, buildMatchNewsPrompt, parseNewsJSON } from "../../Helpers/matchNews.mjs";
import { buildNewsDraftPrompt } from "../../Helpers/newsDraft.mjs";

const SUPER_ADMIN_ROLE = "1";
const LEAGUE_ADMIN_ROLE = "4";

const requireSuperAdmin = (context) => {
    const u = context?.user;
    if (!context?.isAuth || !u) throw new ApolloError("يلزم تسجيل الدخول", "AUTH_REQUIRED");
    if (u.role !== SUPER_ADMIN_ROLE) throw new ApolloError("غير مصرّح: المالك (السوبر-أدمن) فقط", "FORBIDDEN");
    return u;
};

// News generation is a content action — the owner (super-admin) and the league
// admins who run the matches may trigger it.
const requireNewsAuthor = (context) => {
    const u = context?.user;
    if (!context?.isAuth || !u) throw new ApolloError("يلزم تسجيل الدخول", "AUTH_REQUIRED");
    if (u.role !== SUPER_ADMIN_ROLE && u.role !== LEAGUE_ADMIN_ROLE) {
        throw new ApolloError("غير مصرّح: المالك أو مدير البطولة فقط", "FORBIDDEN");
    }
    return u;
};

const personName = (person) =>
    [person?.first_name, person?.second_name, person?.third_name].filter(Boolean).join(" ").trim();

const looksLikeName = (s) => typeof s === "string" && /[؀-ۿ]/.test(s) && /\s/.test(s);

// Best-effort resolution of Match.manOfMatch (a STRING column that may hold a
// player id or a free-text name). Never throws.
const resolveManOfMatch = async (raw) => {
    if (!raw) return null;
    try {
        const player = await Players.findByPk(raw, { include: [{ model: Person, as: "person" }] });
        const name = personName(player?.person);
        if (name) return name;
    } catch { /* not a player id */ }
    return looksLikeName(raw) ? raw.trim() : null;
};

// Best-effort scorer list for a match. Returns [] on any gap rather than
// failing the whole generation.
const gatherScorers = async (idMatch) => {
    try {
        const rows = await ScorerMatch.findAll({
            where: { id_match: idMatch },
            include: [
                {
                    model: ParticipatingPlayers,
                    include: [{ model: Players, as: "player", include: [{ model: Person, as: "person" }] }],
                },
                { model: ParticipatingTeams, include: [{ model: Team, as: "team" }] },
            ],
            order: [["time", "ASC"]],
        });
        return rows
            .map((r) => ({
                player: personName(r?.participating_player?.player?.person),
                team: r?.participating_team?.team?.name || "",
                time: r?.time || "",
            }))
            .filter((s) => s.player);
    } catch (e) {
        logger.warn?.(`gatherScorers(${idMatch}): ${e?.message}`);
        return [];
    }
};

// Assemble the facts the news writer needs from one match.
// Exported for integration testing (seed a match → assert the gathered facts).
export const gatherMatchFacts = async (idMatch) => {
    const match = await Match.findByPk(idMatch, {
        include: [
            { model: ParticipatingTeams, as: "firstTeam", include: [{ model: Team, as: "team" }] },
            { model: ParticipatingTeams, as: "secondTeam", include: [{ model: Team, as: "team" }] },
            { model: League, as: "league" },
        ],
    });
    if (!match) throw new ApolloError("المباراة غير موجودة", "MATCH_NOT_FOUND");

    const teamA = match.firstTeam?.team?.name;
    const teamB = match.secondTeam?.team?.name;
    if (!teamA || !teamB) throw new ApolloError("بيانات فرق المباراة غير مكتملة", "MATCH_TEAMS_MISSING");

    const [manOfMatch, scorers] = await Promise.all([
        resolveManOfMatch(match.manOfMatch),
        gatherScorers(idMatch),
    ]);

    return {
        league: match.league?.name || "",
        stage: stageLabelAr(match.type),
        teamA, teamB,
        goalsA: match.firstTeamGoal ?? 0,
        goalsB: match.secondTeamGoal ?? 0,
        venue: match.venue || "",
        date: match.date || "",
        minute: match.minute || "",
        note: match.note || "",
        manOfMatch,
        scorers,
    };
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

        aiMatchCandidates: async (obj, { limit }, context) => {
            const u = requireNewsAuthor(context);
            const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
            const where = {};
            // League admins only see matches in the leagues they own.
            if (u.role === LEAGUE_ADMIN_ROLE) {
                const leagues = await League.findAll({ where: { id_user: u.id }, attributes: ["id"] });
                const ids = leagues.map((l) => l.id);
                if (!ids.length) return [];
                where.id_league = ids;
            }
            const matches = await Match.findAll({
                where,
                order: [["createdAt", "DESC"]],
                limit: take,
                include: [
                    { model: ParticipatingTeams, as: "firstTeam", include: [{ model: Team, as: "team" }] },
                    { model: ParticipatingTeams, as: "secondTeam", include: [{ model: Team, as: "team" }] },
                    { model: League, as: "league" },
                ],
            });
            return matches
                .map((m) => ({
                    id: m.id,
                    date: m.date || "",
                    stage: stageLabelAr(m.type),
                    league: m.league?.name || "",
                    teamA: m.firstTeam?.team?.name || "",
                    teamB: m.secondTeam?.team?.name || "",
                    goalsA: m.firstTeamGoal ?? 0,
                    goalsB: m.secondTeamGoal ?? 0,
                    matchState: m.matchState,
                }))
                .filter((c) => c.teamA && c.teamB); // only matches with resolvable teams
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

        // Generate a news article from a finished match and save it as a Blog.
        // publish=true posts it live (status "accepted"); otherwise it is saved
        // as a draft (status "waiting") for review before it appears in the feed.
        generateMatchNews: async (obj, { id_match, publish }, context) => {
            requireNewsAuthor(context);

            const facts = await gatherMatchFacts(id_match);
            const { system, prompt } = buildMatchNewsPrompt(facts);

            let text;
            try {
                text = await generateText({ prompt, system });
            } catch (e) {
                logger.error(`generateMatchNews.generate(${id_match}): ${e?.message}`);
                throw new ApolloError(e.message || "تعذّر توليد الخبر", "AI_GENERATE_FAILED");
            }

            let news;
            try {
                news = parseNewsJSON(text);
            } catch (e) {
                logger.error(`generateMatchNews.parse(${id_match}): ${e?.message}`);
                throw new ApolloError(e.message || "تعذّرت قراءة الخبر المُولَّد", "AI_PARSE_FAILED");
            }

            try {
                return await Blog.create({
                    subject: news.subject,
                    short_description: news.short_description,
                    description: news.description,
                    status: publish ? "accepted" : "waiting",
                    category: "competitions",
                    author_name: "محرّر طموح الذكي",
                });
            } catch (e) {
                logger.error(`generateMatchNews.save(${id_match}): ${e?.message}`);
                throw new ApolloError(e.message || "فشل حفظ الخبر", "AI_SAVE_FAILED");
            }
        },

        // AI news editor — returns an editable draft only (no save). The caller
        // reviews/edits and then persists via createBlog.
        draftNews: async (obj, { content }, context) => {
            requireNewsAuthor(context);
            if (!content?.text || !content.text.trim()) throw new ApolloError("النص مطلوب", "TEXT_REQUIRED");

            let prompt, system;
            try {
                ({ prompt, system } = buildNewsDraftPrompt(content));
            } catch (e) {
                throw new ApolloError(e.message || "مدخلات غير صحيحة", "BAD_INPUT");
            }

            let text;
            try {
                text = await generateText({ prompt, system });
            } catch (e) {
                logger.error(`draftNews.generate: ${e?.message}`);
                throw new ApolloError(e.message || "تعذّر توليد الخبر", "AI_GENERATE_FAILED");
            }

            try {
                return parseNewsJSON(text);
            } catch (e) {
                logger.error(`draftNews.parse: ${e?.message}`);
                throw new ApolloError(e.message || "تعذّرت قراءة الخبر المُولَّد", "AI_PARSE_FAILED");
            }
        },
    },
};
