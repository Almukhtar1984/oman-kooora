import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import logger from "../../Config/logger.mjs";
import {
    AiSetting, Match, ParticipatingTeams, Team, League, ScorerMatch,
    ParticipatingPlayers, Players, Person, Blog,
} from '../../Models/index.mjs';

const { Op } = sequelize;
import { encryptSecret, decryptSecret } from "../../Helpers/Secrets.mjs";
import { AI_PROVIDERS, fetchModels, testConnection, generateText } from "../../Config/ai.mjs";
import { stageLabelAr, buildMatchNewsPrompt, parseNewsJSON } from "../../Helpers/matchNews.mjs";
import { buildNewsDraftPrompt } from "../../Helpers/newsDraft.mjs";
import { buildMessageDraftPrompt, parseMessageJSON } from "../../Helpers/messageDraft.mjs";
import { disconnectPatch } from "../../Helpers/aiConnection.mjs";

const SUPER_ADMIN_ROLE = "1";
const CLUB_ADMIN_ROLE = "2";
const TEAM_ADMIN_ROLE = "3";
const LEAGUE_ADMIN_ROLE = "4";

// Roles allowed to USE the AI content tools (generate/draft). The connection
// itself (keys/models) stays super-admin only.
const CONTENT_AUTHOR_ROLES = [SUPER_ADMIN_ROLE, CLUB_ADMIN_ROLE, TEAM_ADMIN_ROLE, LEAGUE_ADMIN_ROLE];
// Roles that may publish straight to the public feed. A team always submits a
// draft that its club reviews first.
const PUBLISHER_ROLES = [SUPER_ADMIN_ROLE, CLUB_ADMIN_ROLE, LEAGUE_ADMIN_ROLE];

// Decide a generated article's Blog status. Teams can never self-publish — their
// news is held as a draft ("waiting") for the club to review. Exported for tests.
export const resolveNewsStatus = (role, publish) =>
    (publish && PUBLISHER_ROLES.includes(role)) ? "accepted" : "waiting";

const requireSuperAdmin = (context) => {
    const u = context?.user;
    if (!context?.isAuth || !u) throw new ApolloError("يلزم تسجيل الدخول", "AUTH_REQUIRED");
    if (u.role !== SUPER_ADMIN_ROLE) throw new ApolloError("غير مصرّح: المالك (السوبر-أدمن) فقط", "FORBIDDEN");
    return u;
};

// AI content tools — owner, league admin, club admin and team admin may use
// them (they consume the owner's platform key). Teams' output is held as a
// draft for club review (enforced per-mutation via PUBLISHER_ROLES).
const requireContentAuthor = (context) => {
    const u = context?.user;
    if (!context?.isAuth || !u) throw new ApolloError("يلزم تسجيل الدخول", "AUTH_REQUIRED");
    if (!CONTENT_AUTHOR_ROLES.includes(u.role)) {
        throw new ApolloError("غير مصرّح باستخدام أدوات الذكاء الاصطناعي", "FORBIDDEN");
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

        // Recent matches the caller can turn into news, scoped to what they run:
        //  - id_team  → matches that team played in (team app)
        //  - id_club  → matches of that club's teams (club app)
        //  - league admin → matches in the leagues they own
        //  - super admin → all
        // Follows the app convention of passing the caller's own id_team/id_club.
        aiMatchCandidates: async (obj, { limit, id_team, id_club }, context) => {
            const u = requireContentAuthor(context);
            const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
            const where = {};

            // Resolve the participating-team rows (match.first_team/second_team
            // point at participating_teams, which carry id_team).
            const scopeByParticipating = async (teamIds) => {
                if (!teamIds.length) return null;
                const pts = await ParticipatingTeams.findAll({ where: { id_team: teamIds }, attributes: ["id"] });
                const ptIds = pts.map((p) => p.id);
                if (!ptIds.length) return null;
                return { [Op.or]: [{ first_team: ptIds }, { second_team: ptIds }] };
            };

            if (id_team) {
                const scope = await scopeByParticipating([id_team]);
                if (!scope) return [];
                Object.assign(where, scope);
            } else if (id_club) {
                const teams = await Team.findAll({ where: { id_club }, attributes: ["id"] });
                const scope = await scopeByParticipating(teams.map((t) => t.id));
                if (!scope) return [];
                Object.assign(where, scope);
            } else if (u.role === LEAGUE_ADMIN_ROLE) {
                const leagues = await League.findAll({ where: { id_user: u.id }, attributes: ["id"] });
                const ids = leagues.map((l) => l.id);
                if (!ids.length) return [];
                where.id_league = ids;
            } else if (u.role !== SUPER_ADMIN_ROLE) {
                // A club/team admin that sent no scope sees nothing (avoids leaking all matches).
                return [];
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

        disconnectAiProvider: async (obj, { provider }, context) => {
            requireSuperAdmin(context);
            if (!AI_PROVIDERS.includes(provider)) throw new ApolloError("مزوّد غير مدعوم", "BAD_PROVIDER");

            const s = await getSettings();
            try {
                await s.update(disconnectPatch(s, provider));
                return { status: true };
            } catch (e) {
                logger.error(`disconnectAiProvider: ${e?.message}`);
                throw new ApolloError(e.message || "فشل إلغاء الربط", "AI_DISCONNECT_FAILED");
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
        // Status rules:
        //  - a team (role 3) always saves a DRAFT ("waiting") for its club to review;
        //  - the owner / league / club may publish live when publish=true.
        // id_team / id_club tag the news so it shows under that team/club.
        generateMatchNews: async (obj, { id_match, publish, id_team, id_club }, context) => {
            const u = requireContentAuthor(context);

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

            // Teams cannot self-publish; everyone else honours the publish flag.
            const status = resolveNewsStatus(u.role, publish);

            try {
                return await Blog.create({
                    subject: news.subject,
                    short_description: news.short_description,
                    description: news.description,
                    status,
                    category: "competitions",
                    author_name: "محرّر طموح الذكي",
                    ...(id_team ? { id_team } : {}),
                    ...(id_club ? { id_club } : {}),
                });
            } catch (e) {
                logger.error(`generateMatchNews.save(${id_match}): ${e?.message}`);
                throw new ApolloError(e.message || "فشل حفظ الخبر", "AI_SAVE_FAILED");
            }
        },

        // AI news editor — returns an editable draft only (no save). The caller
        // reviews/edits and then persists via createBlog.
        draftNews: async (obj, { content }, context) => {
            requireContentAuthor(context);
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

        // AI message drafter — returns an editable {subject, content} only (no
        // send). The caller reviews/edits and then sends via createMessage.
        draftMessage: async (obj, { content }, context) => {
            requireContentAuthor(context);
            if (!content?.brief || !content.brief.trim()) throw new ApolloError("موضوع الرسالة مطلوب", "BRIEF_REQUIRED");

            let prompt, system;
            try {
                ({ prompt, system } = buildMessageDraftPrompt(content));
            } catch (e) {
                throw new ApolloError(e.message || "مدخلات غير صحيحة", "BAD_INPUT");
            }

            let text;
            try {
                text = await generateText({ prompt, system });
            } catch (e) {
                logger.error(`draftMessage.generate: ${e?.message}`);
                throw new ApolloError(e.message || "تعذّر توليد الرسالة", "AI_GENERATE_FAILED");
            }

            try {
                return parseMessageJSON(text);
            } catch (e) {
                logger.error(`draftMessage.parse: ${e?.message}`);
                throw new ApolloError(e.message || "تعذّرت قراءة الرسالة المُولَّدة", "AI_PARSE_FAILED");
            }
        },
    },
};
