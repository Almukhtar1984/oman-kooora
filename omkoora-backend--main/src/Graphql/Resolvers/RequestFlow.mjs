import { ApolloError } from 'apollo-server-express';

import logger from "../../Config/logger.mjs";
import {
    Club, Person, PlayerRelease, Players, RequestFlow, RequestFlowEvent, RequestPayment, Team, Transfer,
} from '../../Models/index.mjs';
import sequelize from 'sequelize';

import { callerClubId, callerTeamId } from "../../Helpers/clubScope.mjs";
import { advanceFlow, flowFor, suggestedAmountFor } from "../../Helpers/requestFlowRunner.mjs";
import {
    STAGES, stageInfo, stageLabelFor, isDone, requestTypeLabel, availableActions,
    SUBMITTED, CLUB_PROCESSING, CANCELLED,
} from "../../Helpers/requestFlow.mjs";
import { pendingApprover } from "../../Helpers/transferFlow.mjs";
import { feeLabel } from "../../Helpers/clubFees.mjs";

const { Op } = sequelize;

// من هو المستدعي في هذا المسار؟
//
// صاحبُه الفريق الذي يسدّد، أو النادي الذي يستكمل ويعتمد — ولهما الإجراء. وللانتقال
// طرفٌ ثانٍ: الفريق الذي يُخرج اللاعب وناديه. هؤلاء يَرون الخط، فالطلب طلبهم
// أيضاً — بل الفريق المُعير هو من قدّمه. ويملك النادي منهم قراره في سلسلة
// الناديين حين يحين دوره فيها ("chain")، وإلا فهو مراقب يرى ولا يحرّك.
const sideOf = async (context, flow, transfer = undefined) => {
    const [idClub, idTeam] = await Promise.all([callerClubId(context), callerTeamId(context)]);
    if (idTeam && flow.id_team === idTeam) return "team";

    if (flow.entity_type === "transfer") {
        const row = transfer === undefined ? await Transfer.findByPk(flow.entity_id) : transfer;
        // دور الناديين في المراجعة المبدئية: سلسلتهما لا أزرار المسار.
        if (idClub && row && flow.stage === SUBMITTED) {
            const turn = pendingApprover(row.status);
            const approver = turn === "from" ? row.id_club_from : turn === "to" ? row.id_club_to : null;
            if (approver && approver === idClub) return "chain";
        }
        if (idClub && flow.id_club === idClub) return "club";
        const counterpart = (idTeam && row?.id_team_from === idTeam)
            || (idClub && row?.id_club_from === idClub);
        if (counterpart) return "observer";
        return null;
    }

    if (idClub && flow.id_club === idClub) return "club";
    return null;
};

// قرار النادي في سلسلة الناديين يُتّخذ بزرّي السلسلة نفسها (updateTransfer):
// القبول يختار الفريق المستقبِل حين يكون النادي هو المستقبِل ولم يُسمَّ فريقه.
const chainActions = (transfer, idClub) => {
    const receiving = transfer?.id_club_to && transfer.id_club_to === idClub;
    return [
        {
            to: null, kind: "transfer_accept", label: "موافقة النادي",
            needsReason: false, needsAmount: false,
            needsTeam: Boolean(receiving),
        },
        {
            to: null, kind: "transfer_reject", label: "رفض (مع السبب)",
            needsReason: true, needsAmount: false, needsTeam: false,
        },
    ];
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

/** سجلّات الانتقال لمجموعة مسارات — استعلام واحد. */
const transfersFor = async (flows) => {
    const ids = flows.filter((flow) => flow.entity_type === "transfer").map((flow) => flow.entity_id);
    if (!ids.length) return new Map();
    const rows = await Transfer.findAll({ where: { id: ids } });
    return new Map(rows.map((row) => [row.id, row]));
};

/**
 * المسار كما تقرأه الواجهة: مسمّياته، واسم لاعبه، ومطالبته، وما يجوز فيه لهذا
 * المستدعي — والمبلغ المقترح حين يكون الدور على النادي أن يطالب.
 *
 * يُجلب ما يحتاجه السطر الواحد والقائمة كلها بالعدد نفسه من الاستعلامات.
 */
const enrich = async (flows, context) => {
    const [names, payments, transfers, idClub] = await Promise.all([
        subjectsFor(flows), paymentsFor(flows), transfersFor(flows), callerClubId(context),
    ]);
    return Promise.all(flows.map(async (flow) => {
        const plain = flow.get ? flow.get({ plain: true }) : flow;
        const transfer = plain.entity_type === "transfer" ? transfers.get(plain.entity_id) || null : undefined;
        const side = await sideOf(context, plain, transfer);
        const suggestedAmount = side === "club" && plain.stage === CLUB_PROCESSING
            ? await suggestedAmountFor(plain)
            : null;
        return withLabels({
            ...plain,
            subject: subjectOf(plain, names),
            payment: plain.payment || (plain.id_payment ? payments.get(plain.id_payment) || null : null),
            // الخط من الأقدم إلى الأحدث — وهو ترتيبه الذي يُقرأ به.
            events: [...(plain.events || [])].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        }, { side, transfer, idClub, suggestedAmount });
    }));
};

const withLabels = (flow, { side = null, transfer = null, idClub = null, suggestedAmount = null } = {}) => {
    const plain = flow.get ? flow.get({ plain: true }) : flow;
    const info = stageInfo(plain.stage) || {};
    return {
        ...plain,
        side,
        suggestedAmount,
        request_label: requestTypeLabel(plain.request_type),
        label: stageLabelFor(plain.stage, plain),
        also: info.also || null,
        actor: info.actor || null,
        done: isDone(plain.stage),
        fee_waived: Boolean(plain.fee_waived),
        events: (plain.events || []).map((event) => ({
            ...event,
            label: stageLabelFor(event.stage, plain),
        })),
        payment: plain.payment
            ? { ...plain.payment, label: feeLabel(plain.payment.fee_type) }
            : null,
        // ما يجوز لهذا الطرف الآن — تُبنى منه الأزرار، فلا يُعرض زر يُرفض ضغطه.
        // ولا أزرار للمراقب: يرى الخط ولا يحرّكه.
        actions: actionsFor(plain, side, transfer, idClub),
    };
};

const actionsFor = (flow, side, transfer, idClub) => {
    if (side === "chain") return chainActions(transfer, idClub);
    if (side !== "team" && side !== "club") return [];
    const list = availableActions(flow, side).map((action) => ({ ...action, needsTeam: false }));
    // الانتقال في مراجعته المبدئية يمضي بسلسلة الناديين، لا بزرّ «قبول مبدئي»
    // يتخطّاها — يبقى منه الإلغاء وحده.
    if (flow.entity_type === "transfer" && flow.stage === SUBMITTED) {
        return list.filter((action) => action.to === CANCELLED);
    }
    return list;
};

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

                const side = await sideOf(context, flow);
                if (!side) return null;        // ليس طلبه، فلا يراه

                const [enriched] = await enrich([flow], context);
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

                if (!idTeam && !idClub) return [];

                // طلبات الطرف نفسه، وطلبات الانتقال التي هو طرفها الثاني: الفريق
                // المُعير قدّم الإعارة، والنادي المُرسِل يبتّ فيها أولاً — فكلاهما
                // يجب أن يجد خطّها في صفحته، لا عند الطرف الآخر وحده.
                const outgoing = await Transfer.findAll({
                    where: idTeam ? { id_team_from: idTeam } : { id_club_from: idClub },
                    attributes: ["id"],
                });
                const own = idTeam ? { id_team: idTeam } : { id_club: idClub };
                const where = outgoing.length
                    ? {
                        [Op.or]: [
                            own,
                            { entity_type: "transfer", entity_id: { [Op.in]: outgoing.map((row) => row.id) } },
                        ],
                    }
                    : own;
                if (stage) where.stage = stage;
                if (request_type) where.request_type = request_type;

                const rows = await RequestFlow.findAll({
                    where, include: FLOW_INCLUDE, order: [["updatedAt", "DESC"]],
                });
                return await enrich(rows, context);
            } catch (error) {
                logger.error(`RequestFlow.myRequestFlows: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },

    Mutation: {
        advanceRequestFlow: async (obj, { id, to, reason, amount }, context) => {
            try {
                const flow = await RequestFlow.findByPk(id);
                if (!flow) {
                    return { ok: false, code: "FLOW_NOT_FOUND", message: "مسار الطلب غير موجود", flow: null };
                }

                const by = await sideOf(context, flow);
                if (!by) {
                    return { ok: false, code: "FLOW_FORBIDDEN", message: "هذا الطلب ليس لك", flow: null };
                }
                if (by === "observer" || by === "chain") {
                    return {
                        ok: false, code: "FLOW_OBSERVER", flow: null,
                        message: by === "chain"
                            ? "قرار ناديك في هذا الطلب بالموافقة أو الرفض في سلسلة الناديين"
                            : "تتابع هذا الطلب ولا تملك البتّ فيه",
                    };
                }
                // المراجعة المبدئية للانتقال سلسلة الناديين نفسها، لا زرّ يتخطّاها.
                if (flow.entity_type === "transfer" && flow.stage === SUBMITTED && to !== CANCELLED) {
                    return {
                        ok: false, code: "TRANSFER_CHAIN", flow: null,
                        message: "الانتقال في مراجعة الناديين — يُقبل أو يُرفض بقرارهما",
                    };
                }

                const result = await advanceFlow({
                    flow, to, by, reason,
                    amount: amount ?? null,
                    id_user: context?.user?.id || null,
                });
                if (!result.ok) {
                    return { ok: false, code: result.code, message: result.message, flow: null };
                }

                const fresh = await flowFor(flow.entity_type, flow.entity_id);
                const [enriched] = fresh ? await enrich([fresh], context) : [null];
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
