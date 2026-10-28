import { ApolloError } from 'apollo-server-express';

import logger from "../../Config/logger.mjs";
import { Club, RequestFlow, RequestFlowEvent, RequestPayment, Team, Transfer } from '../../Models/index.mjs';
import { callerClubId, callerTeamId } from "../../Helpers/clubScope.mjs";
import { advanceFlow, flowFor } from "../../Helpers/requestFlowRunner.mjs";
import {
    STAGES, stageInfo, stageLabel, isDone, requestTypeLabel,
    canAdvance, CANCELLED,
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

const withLabels = (flow, { by = null } = {}) => {
    const plain = flow.get ? flow.get({ plain: true }) : flow;
    const info = stageInfo(plain.stage) || {};
    return {
        ...plain,
        request_label: requestTypeLabel(plain.request_type),
        label: info.label || "",
        also: info.also || null,
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
            label: to === CANCELLED ? "إلغاء الطلب" : stageLabel(to),
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

                const payment = flow.id_payment ? await RequestPayment.findByPk(flow.id_payment) : null;
                const full = flow.get({ plain: true });
                full.payment = payment ? payment.get({ plain: true }) : null;
                full.events = (full.events || []).sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                return withLabels(full, { by });
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
                return rows.map((row) => withLabels(row, { by }));
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
                return {
                    ok: true,
                    code: null,
                    message: `الطلب الآن: ${result.label}`,
                    flow: fresh ? withLabels(fresh, { by }) : null,
                };
            } catch (error) {
                logger.error(`RequestFlow.advanceRequestFlow: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },
};
