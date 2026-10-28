import { ApolloError } from 'apollo-server-express';

import logger from "../../Config/logger.mjs";
import {
    Club, Person, PlayerRelease, Players, RequestFlow, RequestFlowEvent, RequestPayment, Team, Transfer,
} from '../../Models/index.mjs';
import { callerClubId, callerTeamId } from "../../Helpers/clubScope.mjs";
import { advanceFlow, flowFor } from "../../Helpers/requestFlowRunner.mjs";
import {
    STAGES, stageInfo, stageLabel, actionLabel, isDone, requestTypeLabel,
    canAdvance,
} from "../../Helpers/requestFlow.mjs";
import { feeLabel } from "../../Helpers/clubFees.mjs";

// من هو المستدعي في هذا المسار؟
//
// صاحبُه الفريق الذي يسدّد، أو النادي الذي يبتّ — ولهما الإجراء. وللانتقال
// طرفٌ ثانٍ: الفريق الذي يُخرج اللاعب وناديه. هذان يَريان الخط ولا يحرّكانه،
// فالطلب طلبهما أيضاً — وقد كان محجوباً عنهما، فيقدّم الفريق طلباً ثم لا يرى
// خطّه، وهو عين ما بُني الخط لإزالته.
const sideOf = async (context, flow) => {
    const [idClub, idTeam] = await Promise.all([callerClubId(context), callerTeamId(context)]);
    if (idTeam && flow.id_team === idTeam) return "team";
    if (idClub && flow.id_club === idClub) return "club";

    if (flow.entity_type === "transfer") {
        const transfer = await Transfer.findByPk(flow.entity_id);
        const counterpart = (idTeam && transfer?.id_team_from === idTeam)
            || (idClub && transfer?.id_club_from === idClub);
        if (counterpart) return "observer";
    }
    return null;
};

// اسم اللاعب الذي عن الطلب.
//
// بغيره يفتح الفريق خطّه فيجد ثلاثين سطراً نصّها واحد: «تسجيل لاعب جديد» —
// فلا يعرف أيّها لاعبه. ويُجلب للقائمة كلها في ثلاثة استعلامات لا في اثنين
// لكل سطر: نادٍ له خمسة وأربعون فريقاً يفتح هذه الصفحة في كل حال.
const PERSON = {
    model: Person, as: "person",
    attributes: ["first_name", "second_name", "third_name", "tribe"],
};

const fullName = (person) =>
    [person?.first_name, person?.second_name, person?.third_name, person?.tribe]
        .filter(Boolean).join(" ").trim() || null;

const subjectsFor = async (flows) => {
    const names = new Map();
    const ids = { player: [], transfer: [], player_release: [] };
    flows.forEach((flow) => ids[flow.entity_type]?.push(flow.entity_id));

    const inList = (list) => ({ id: list });
    const [players, transfers, releases] = await Promise.all([
        ids.player.length
            ? Players.findAll({ where: inList(ids.player), include: [PERSON] }) : [],
        ids.transfer.length
            ? Transfer.findAll({
                where: inList(ids.transfer),
                include: [{ model: Players, as: "player", include: [PERSON] }],
            }) : [],
        ids.player_release.length
            ? PlayerRelease.findAll({
                where: inList(ids.player_release),
                include: [{ model: Players, as: "player", include: [PERSON] }],
            }) : [],
    ]);

    players.forEach((row) => names.set(`player:${row.id}`, fullName(row.person)));
    transfers.forEach((row) => names.set(`transfer:${row.id}`, fullName(row.player?.person)));
    releases.forEach((row) => names.set(`player_release:${row.id}`, fullName(row.player?.person)));
    return names;
};

const subjectOf = (flow, names) => names.get(`${flow.entity_type}:${flow.entity_id}`) || null;

/** مطالبات الرسوم لمجموعة مسارات — استعلام واحد لا استعلام لكل سطر. */
const paymentsFor = async (flows) => {
    const ids = flows.map((flow) => flow.id_payment).filter(Boolean);
    if (!ids.length) return new Map();
    const rows = await RequestPayment.findAll({ where: { id: ids } });
    return new Map(rows.map((row) => [row.id, row.get({ plain: true })]));
};

/**
 * المسار كما تقرأه الواجهة: مسمّياته، واسم لاعبه، ومطالبته، وما يجوز فيه.
 *
 * يُجلب ما يحتاجه السطر الواحد والقائمة كلها بالعدد نفسه من الاستعلامات.
 */
const enrich = async (flows, { by = null } = {}) => {
    const [names, payments] = await Promise.all([subjectsFor(flows), paymentsFor(flows)]);
    return flows.map((flow) => {
        const plain = flow.get ? flow.get({ plain: true }) : flow;
        return withLabels({
            ...plain,
            subject: subjectOf(plain, names),
            payment: plain.payment || (plain.id_payment ? payments.get(plain.id_payment) || null : null),
            // الخط من الأقدم إلى الأحدث — وهو ترتيبه الذي يُقرأ به.
            events: [...(plain.events || [])].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        }, { by });
    });
};

const withLabels = (flow, { by = null } = {}) => {
    const plain = flow.get ? flow.get({ plain: true }) : flow;
    const info = stageInfo(plain.stage) || {};
    return {
        ...plain,
        request_label: requestTypeLabel(plain.request_type),
        label: info.label || "",
        also: info.also || null,
        actor: info.actor || null,
        done: isDone(plain.stage),
        events: (plain.events || []).map((event) => ({
            ...event,
            label: stageLabel(event.stage),
        })),
        payment: plain.payment
            ? { ...plain.payment, label: feeLabel(plain.payment.fee_type) }
            : null,
        // ما يجوز لهذا الطرف الآن — تُبنى منه الأزرار، فلا يُعرض زر يُرفض ضغطه.
        // ولا أزرار للمراقب: يرى الخط ولا يحرّكه.
        actions: (by && by !== "observer") ? availableActions(plain, by) : [],
    };
};

const availableActions = (flow, by) =>
    STAGES
        .map((stage) => stage.stage)
        .filter((to) => canAdvance(flow, { to, by, reason: "—", type: flow.request_type }).ok)
        .map((to) => ({
            to,
            label: actionLabel(to),
            needsReason: Boolean(stageInfo(to)?.needsReason),
        }));

const FLOW_INCLUDE = [
    { model: RequestFlowEvent, as: "events", required: false },
    { model: Team, required: false },
    { model: Club, required: false },
];

export const resolvers = {
    Query: {
        requestFlowStages: async () => STAGES.map((stage) => ({
            stage: stage.stage,
            label: stage.label,
            also: stage.also,
            actor: stage.actor,
            done: Boolean(stage.done),
        })),

        requestFlow: async (obj, { entity_type, entity_id }, context) => {
            try {
                const flow = await flowFor(entity_type, entity_id);
                if (!flow) return null;

                const by = await sideOf(context, flow);
                if (!by) return null;        // ليس طلبه، فلا يراه

                const [enriched] = await enrich([flow], { by });
                return enriched;
            } catch (error) {
                logger.error(`RequestFlow.requestFlow: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        myRequestFlows: async (obj, { stage, request_type }, context) => {
            try {
                const [idClub, idTeam] = await Promise.all([
                    callerClubId(context), callerTeamId(context),
                ]);

                const where = {};
                let by = null;
                if (idTeam) { where.id_team = idTeam; by = "team"; }
                else if (idClub) { where.id_club = idClub; by = "club"; }
                else return [];

                if (stage) where.stage = stage;
                if (request_type) where.request_type = request_type;

                const rows = await RequestFlow.findAll({
                    where, include: FLOW_INCLUDE, order: [["updatedAt", "DESC"]],
                });
                return await enrich(rows, { by });
            } catch (error) {
                logger.error(`RequestFlow.myRequestFlows: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },

    Mutation: {
        advanceRequestFlow: async (obj, { id, to, reason }, context) => {
            try {
                const flow = await RequestFlow.findByPk(id);
                if (!flow) {
                    return { ok: false, code: "FLOW_NOT_FOUND", message: "مسار الطلب غير موجود", flow: null };
                }

                const by = await sideOf(context, flow);
                if (!by) {
                    return { ok: false, code: "FLOW_FORBIDDEN", message: "هذا الطلب ليس لك", flow: null };
                }
                if (by === "observer") {
                    return {
                        ok: false, code: "FLOW_OBSERVER", flow: null,
                        message: "تتابع هذا الطلب ولا تملك البتّ فيه",
                    };
                }

                const result = await advanceFlow({
                    flow, to, by, reason,
                    id_user: context?.user?.id || null,
                });
                if (!result.ok) {
                    return { ok: false, code: result.code, message: result.message, flow: null };
                }

                const fresh = await flowFor(flow.entity_type, flow.entity_id);
                const [enriched] = fresh ? await enrich([fresh], { by }) : [null];
                return {
                    ok: true,
                    code: null,
                    message: `الطلب الآن: ${result.label}`,
                    flow: enriched,
                };
            } catch (error) {
                logger.error(`RequestFlow.advanceRequestFlow: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },
};
