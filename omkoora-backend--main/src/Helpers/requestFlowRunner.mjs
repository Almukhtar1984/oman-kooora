// تشغيل مسار الطلب: ما يحدث في قاعدة البيانات حين ينتقل الطلب من مرحلة لأخرى.
//
// The decisions live in requestFlow.mjs and stay pure. This file is the hands:
// it opens a flow when a request is created, moves it when someone acts, keeps
// the request's own legacy `status` column in step, raises the fee the club
// bills when the road reaches payment, performs the request's effect at the
// final approval (requestOutcomes.mjs), and tells the other side what happened.
//
// كل ما هنا «أفضل جهد»: فتح المسار أو تسجيل حدث لا يجوز أن يُسقط تسجيل لاعب.
// الطلب نفسه هو الأصل، والخط خدمةٌ فوقه — فإن تعثّر الخط سُجّل الخطأ ومضى
// الطلب. أما الانتقال بين المراحل فيردّ نتيجته للمستدعي، لأنه هو الإجراء.

import logger from "../Config/logger.mjs";
import {
    ClubFee, PlayerRelease, Players, RequestFlow, RequestFlowEvent, RequestPayment, Transfer,
} from "../Models/index.mjs";
import { CreateDirectNotification } from "./Notification.mjs";
import { normalizeAmount, PAYMENT_WAITING, PAYMENT_SUBMITTED, PAYMENT_ACCEPTED } from "./clubFees.mjs";
import {
    canAdvance, suggestedFee, legacyStatusFor, legacyDecisionMove, outcomeOf, stageLabelFor,
    requestTypeInfo, requestTypeLabel,
    SUBMITTED, REJECTED_INITIAL, CLUB_PROCESSING, AWAITING_PAYMENT, PAID_REVIEW,
    APPROVED, REJECTED_FINAL, CANCELLED,
} from "./requestFlow.mjs";
import { outcomeBlocker, performOutcome } from "./requestOutcomes.mjs";

// السجلّ الذي يحمل الحالة القديمة لكل نوع طلب.
const ENTITY_MODELS = {
    player:         Players,
    transfer:       Transfer,
    player_release: PlayerRelease,
};

/** مسار طلب بعينه، ومعه خطّه مرتباً من الأقدم للأحدث. */
export const flowFor = async (entity_type, entity_id, { withEvents = true } = {}) => {
    if (!entity_type || !entity_id) return null;
    return RequestFlow.findOne({
        where: { entity_type, entity_id },
        include: withEvents
            ? [{ model: RequestFlowEvent, as: "events", required: false }]
            : [],
        order: withEvents ? [[{ model: RequestFlowEvent, as: "events" }, "createdAt", "ASC"]] : undefined,
    });
};

const addEvent = async (flow, { stage, note = null, actor = "system", id_user = null }) => {
    try {
        await RequestFlowEvent.create({ id_flow: flow.id, stage, note, actor, id_user });
    } catch (error) {
        logger.error(`requestFlow.addEvent: ${error?.message || error}`);
    }
};

/**
 * يفتح مساراً للطلب حين يُنشأ — ولا يفتح ثانياً إن كان مفتوحاً.
 *
 * الجدول يمنع التكرار بمفتاح فريد على (entity_type, entity_id)، وهذه الدالة
 * تحترمه بدل أن تصطدم به: الطلب الواحد مسار واحد.
 */
export const openFlow = async ({
    request_type, entity_type, entity_id, id_club = null, id_team = null,
    stage = SUBMITTED, actor = "team", id_user = null, note = null,
}) => {
    try {
        if (!requestTypeInfo(request_type) || !entity_type || !entity_id) return null;

        const existing = await RequestFlow.findOne({ where: { entity_type, entity_id } });
        if (existing) return existing;

        const flow = await RequestFlow.create({
            request_type, entity_type, entity_id, stage, id_club, id_team,
        });
        await addEvent(flow, { stage, note, actor, id_user });
        // طلبٌ فتحه النادي بنفسه يبدأ «مقبولاً مبدئياً»، فسجلّه يتبعه من الآن،
        // ويُخبَر الفريق الذي سيسدّد.
        if (stage !== SUBMITTED) {
            await mirrorLegacy(flow);
            void announce(flow);
        }
        return flow;
    } catch (error) {
        // الطلب أهمّ من خطّه: يُسجَّل الخطأ ويمضي الإنشاء.
        logger.error(`requestFlow.openFlow: ${error?.message || error}`);
        return null;
    }
};

/** يكتب الحالة القديمة في سجلّ الطلب نفسه — إن كانت لنوعه حالة تُكتب. */
const mirrorLegacy = async (flow) => {
    try {
        const status = legacyStatusFor(flow.entity_type, flow.stage);
        if (!status) return;
        const Model = ENTITY_MODELS[flow.entity_type];
        if (!Model) return;
        await Model.update({ status }, { where: { id: flow.entity_id } });
    } catch (error) {
        logger.error(`requestFlow.mirrorLegacy: ${error?.message || error}`);
    }
};

/** المبلغ الذي يقترحه سعر النادي لهذا الطلب، أو null إن لم يسعّره. */
export const suggestedAmountFor = async (flow) => {
    const feeType = requestTypeInfo(flow?.request_type)?.fee;
    if (!feeType || !flow?.id_club) return null;
    const fee = await ClubFee.findOne({ where: { id_club: flow.id_club, fee_type: feeType } });
    return suggestedFee({ type: flow.request_type, fee });
};

/**
 * يرفع مطالبة الرسوم بالمبلغ الذي سمّاه النادي.
 *
 * وأخيراً يُملأ العمودان entity_type/entity_id في جدول المدفوعات: كانا موجودين
 * منذ البداية ولا يملؤهما أحد، فكانت الدفعة تشير إلى طلبها بنصّ حرّ يكتبه
 * موظف. الآن الدفعة تعرف طلبها، والطلب يعرف دفعته.
 */
const raiseFee = async (flow, { amount, id_user = null } = {}) => {
    const feeType = requestTypeInfo(flow.request_type)?.fee;
    const payment = await RequestPayment.create({
        fee_type: feeType,
        amount: normalizeAmount(amount),
        entity_type: flow.entity_type,
        entity_id: flow.entity_id,
        status: PAYMENT_WAITING,
        note: requestTypeLabel(flow.request_type),
        id_club: flow.id_club,
        id_team: flow.id_team,
        id_requested_by: id_user,
    });
    await flow.update({ id_payment: payment.id });
    return payment;
};

// نصّ الإشعار لكل مرحلة، ولمن يُرسل.
const announce = async (flow, { payment = null } = {}) => {
    const what = requestTypeLabel(flow.request_type);
    const reason = flow.reason ? ` — ${flow.reason}` : "";

    const toTeam = (body) => CreateDirectNotification({ id_team: flow.id_team, body });
    const toClub = (body) => CreateDirectNotification({ id_club: flow.id_club, body });

    switch (flow.stage) {
        case SUBMITTED:
            return toClub(`طلب ${what} بانتظار مراجعتك المبدئية`);
        case REJECTED_INITIAL:
            return toTeam(`رُفض طلب ${what} مبدئياً${reason} — عدّله وأعد إرساله`);
        case CLUB_PROCESSING:
            return toTeam(`قُبل طلب ${what} مبدئياً — النادي يستكمل الإجراءات`);
        case AWAITING_PAYMENT:
            return toTeam(payment
                ? `طلب ${what}: مطلوب سداد ${Number(payment.amount)} ر.ع لاستكمال الاعتماد`
                : `طلب ${what}: بانتظار سداد الرسوم`);
        case PAID_REVIEW:
            return flow.fee_waived
                ? toTeam(`أُعفي طلب ${what} من الرسوم${reason} — بانتظار الاعتماد النهائي`)
                : toClub(`سُدّدت رسوم طلب ${what} — بانتظار اعتمادك النهائي`);
        case APPROVED:
            return toTeam(`اعتُمد طلب ${what} نهائياً`);
        case REJECTED_FINAL:
            return toTeam(`رُفض طلب ${what} نهائياً${reason}`);
        case CANCELLED:
            return toTeam(`أُلغي طلب ${what}`);
        default:
            return null;
    }
};

/**
 * ينقل الطلب إلى مرحلته التالية — بعد التأكد من جوازه ومن صاحب الحق فيه، ومن
 * أن أثره ممكن التنفيذ.
 *
 * المطالبة بالرسوم تأخذ مبلغ النادي، أو سعره المعلن إن لم يسمِّ مبلغاً — ولا
 * تمضي بلا مبلغ: لا يُعتمد طلبٌ بغياب سعرٍ، بل بإعفاءٍ مكتوب.
 */
export const advanceFlow = async ({
    flow, entity_type, entity_id, to, by, reason = null, id_user = null, note = null,
    viaReceipt = false, amount = null,
}) => {
    try {
        const current = flow || await flowFor(entity_type, entity_id, { withEvents: false });
        if (!current) {
            return { ok: false, code: "FLOW_NOT_FOUND", message: "مسار الطلب غير موجود" };
        }

        const from = current.stage;
        const billing = to === AWAITING_PAYMENT && from === CLUB_PROCESSING;
        const waiving = to === PAID_REVIEW && from === CLUB_PROCESSING;
        const billAmount = billing ? (amount ?? await suggestedAmountFor(current)) : null;
        const why = String(reason ?? "").trim() || null;

        const allowed = canAdvance(current, {
            to, by, reason, type: current.request_type, viaReceipt, amount: billAmount,
        });
        if (!allowed.ok) return allowed;

        const outcome = outcomeOf(current.entity_type, to);
        const blocked = outcome ? await outcomeBlocker(current, outcome) : null;
        if (blocked) return { ok: false, ...blocked };

        let payment = null;
        if (billing) {
            payment = await raiseFee(current, { amount: billAmount, id_user });
        } else if (current.id_payment) {
            payment = await RequestPayment.findByPk(current.id_payment);
        }

        // والدفعة تتبع قرار الطريق، فلا تقول صفحة المدفوعات غير ما يقوله الخط:
        // الاعتماد النهائي يعتمد إيصاله، وردّ الإيصال يعيد المطالبة قائمةً بسببه.
        if (payment && payment.status === PAYMENT_SUBMITTED) {
            if (to === APPROVED) {
                await payment.update({ status: PAYMENT_ACCEPTED, decided_at: new Date(), id_decided_by: id_user });
            } else if (to === AWAITING_PAYMENT) {
                await payment.update({
                    status: PAYMENT_WAITING, decision_note: why, decided_at: new Date(), id_decided_by: id_user,
                    receipt: null, reference_number: null, paid_at: null,
                });
            }
        }

        await current.update({
            stage: to,
            // السبب يخصّ الرفض والإعفاء، ولا يُترك معلّقاً على مرحلة لاحقة.
            reason: why,
            ...(waiving ? { fee_waived: true } : {}),
        });

        try {
            if (outcome) await performOutcome(current, outcome, { id_user, reason: why });
        } catch (error) {
            // الطلب لا يُعتمد على الورق واللاعبُ لم ينتقل: يعود إلى مرحلته.
            await current.update({ stage: from });
            return { ok: false, code: "OUTCOME_FAILED", message: "تعذّر تنفيذ الطلب — لم يتغيّر شيء" };
        }

        await addEvent(current, {
            stage: to,
            note: waiving ? `أُعفي من الرسوم: ${why}` : (why || note || null),
            actor: by || "system",
            id_user,
        });
        await mirrorLegacy(current);
        void announce(current, { payment });

        return { ok: true, flow: current, payment, stage: to, label: stageLabelFor(to, current) };
    } catch (error) {
        logger.error(`requestFlow.advanceFlow: ${error?.message || error}`);
        return { ok: false, code: "FLOW_FAILED", message: "تعذّر تنفيذ الإجراء" };
    }
};

/**
 * قبول أو رفض من صفحةٍ قديمة (بطاقة اللاعب، الإعارات، إخلاء الطرف) — على
 * الطريق نفسه لا بجانبه.
 *
 * طلبٌ بلا مسار — قُدّم قبل أن يوجد الخط — يُفتح له مساره عند قبوله، مقبولاً
 * مبدئياً، فيمرّ بالرسوم كغيره. ورفضه بلا مسار يبقى للصفحة كما كان.
 *
 * @returns {Promise<null | {ok:boolean, code?:string, message:string, stage?:string}>}
 *          null حين لا مسار ولا شيء يُفعل هنا — فتمضي الصفحة على عادتها.
 */
export const decideOnRoad = async ({
    entity_type, entity_id, decision, reason = null, id_user = null, open = null,
}) => {
    const flow = await flowFor(entity_type, entity_id, { withEvents: false });

    if (!flow) {
        if (decision !== "accepted" || !open) return null;
        const opened = await openFlow({
            ...open, entity_type, entity_id, stage: CLUB_PROCESSING, actor: "club", id_user,
            note: "قُبل من صفحة النادي",
        });
        if (!opened) return { ok: false, code: "FLOW_FAILED", message: "تعذّر فتح مسار الطلب" };
        return {
            ok: true,
            stage: CLUB_PROCESSING,
            message: "قُبل الطلب مبدئياً — طالِب بالرسوم أو اعفِه منها من مسار الطلبات",
        };
    }

    const move = legacyDecisionMove(flow.stage, decision);
    if (!move.to) return { ok: false, code: move.code, message: move.message };

    const result = await advanceFlow({
        flow, to: move.to, by: "club",
        reason: reason || (decision === "rejected" ? "رُفض الطلب" : null),
        id_user,
    });
    if (!result.ok) return result;
    return {
        ok: true,
        stage: result.stage,
        message: result.stage === CLUB_PROCESSING
            ? "قُبل الطلب مبدئياً — طالِب بالرسوم أو اعفِه منها من مسار الطلبات"
            : `الطلب الآن: ${result.label}`,
    };
};

/**
 * الفريق رفع إيصاله، فالطلب ينتقل إلى مراجعة النادي.
 *
 * تُستدعى من مسار الدفع نفسه: المالك يريد السداد مرحلةً في الطلب لا سجلّاً
 * بجانبه، فرفع الإيصال يحرّك الطلب كما يحرّكه أي إجراء آخر.
 */
export const onReceiptSubmitted = async (payment, { id_user = null } = {}) => {
    const flow = await flowFor(payment?.entity_type, payment?.entity_id, { withEvents: false });
    if (!flow || flow.stage !== AWAITING_PAYMENT) return null;
    // الإيصال هو ما يملك هذا الانتقال — ومن هنا وحده يُمنح.
    return advanceFlow({ flow, to: PAID_REVIEW, by: "team", id_user, viaReceipt: true });
};

/** النادي ردّ الإيصال، فيعود الطلب إلى السداد لا إلى طريق مسدود. */
export const onReceiptRejected = async (payment, { reason = null, id_user = null } = {}) => {
    const flow = await flowFor(payment?.entity_type, payment?.entity_id, { withEvents: false });
    if (!flow || flow.stage !== PAID_REVIEW) return null;
    return advanceFlow({ flow, to: AWAITING_PAYMENT, by: "club", reason, id_user });
};
