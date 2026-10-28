// تشغيل مسار الطلب: ما يحدث في قاعدة البيانات حين ينتقل الطلب من مرحلة لأخرى.
//
// The decisions live in requestFlow.mjs and stay pure. This file is the hands:
// it opens a flow when a request is created, moves it when someone acts, keeps
// the request's own legacy `status` column in step, raises the club's fee when
// the road reaches payment, and tells the other side what happened.
//
// كل ما هنا «أفضل جهد»: فتح المسار أو تسجيل حدث لا يجوز أن يُسقط تسجيل لاعب.
// الطلب نفسه هو الأصل، والخط خدمةٌ فوقه — فإن تعثّر الخط سُجّل الخطأ ومضى
// الطلب. أما الانتقال بين المراحل فيردّ نتيجته للمستدعي، لأنه هو الإجراء.

import logger from "../Config/logger.mjs";
import {
    ClubFee, PlayerRelease, Players, RequestFlow, RequestFlowEvent, RequestPayment, Team, Transfer,
} from "../Models/index.mjs";
import { CreateDirectNotification } from "./Notification.mjs";
import { feeLabel, normalizeAmount, PAYMENT_WAITING } from "./clubFees.mjs";
import {
    canAdvance, afterProcessing, legacyStatusFor, stageLabel, requestTypeInfo, requestTypeLabel,
    SUBMITTED, REJECTED_INITIAL, CLUB_PROCESSING, AWAITING_PAYMENT, PAID_REVIEW,
    APPROVED, REJECTED_FINAL, CANCELLED,
} from "./requestFlow.mjs";

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

/**
 * يرفع مطالبة الرسوم بسعر النادي المعلن لهذا النوع.
 *
 * وأخيراً يُملأ العمودان entity_type/entity_id في جدول المدفوعات: كانا موجودين
 * منذ البداية ولا يملؤهما أحد، فكانت الدفعة تشير إلى طلبها بنصّ حرّ يكتبه
 * موظف. الآن الدفعة تعرف طلبها، والطلب يعرف دفعته.
 */
const raiseFee = async (flow, { id_user = null } = {}) => {
    const feeType = requestTypeInfo(flow.request_type)?.fee;
    if (!feeType || !flow.id_club) return null;

    const fee = await ClubFee.findOne({ where: { id_club: flow.id_club, fee_type: feeType } });
    if (afterProcessing({ type: flow.request_type, fee }) !== AWAITING_PAYMENT) return null;

    const payment = await RequestPayment.create({
        fee_type: feeType,
        amount: normalizeAmount(fee.amount),
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
            return toClub(`سُدّدت رسوم طلب ${what} — بانتظار اعتمادك النهائي`);
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
 * ينقل الطلب إلى مرحلته التالية — بعد التأكد من جوازه ومن صاحب الحق فيه.
 *
 * ويُستثنى من حرفية الطلب موضع واحد: النادي يطلب الانتقال إلى «سداد الرسوم»
 * فلا يجد لنوع الطلب سعراً مفعّلاً عنده، فيمضي الطلب إلى الاعتماد النهائي بدل
 * أن يُحبس على رسوم لم يضعها أحد.
 */
export const advanceFlow = async ({
    flow, entity_type, entity_id, to, by, reason = null, id_user = null, note = null,
    viaReceipt = false,
}) => {
    try {
        const current = flow || await flowFor(entity_type, entity_id, { withEvents: false });
        if (!current) {
            return { ok: false, code: "FLOW_NOT_FOUND", message: "مسار الطلب غير موجود" };
        }

        let target = to;
        let payment = null;

        const allowed = canAdvance(current, {
            to: target, by, reason, type: current.request_type, viaReceipt,
        });
        if (!allowed.ok) return allowed;

        if (target === AWAITING_PAYMENT) {
            if (current.id_payment) {
                // عائد من ردّ الإيصال: مطالبته قائمة، ولا تُرفع ثانية.
                payment = await RequestPayment.findByPk(current.id_payment);
            } else {
                payment = await raiseFee(current, { id_user });
                // لا سعر مفعّل — فلا انتظار.
                if (!payment) target = APPROVED;
            }
        }

        await current.update({
            stage: target,
            // السبب يخصّ الرفض وحده، ولا يُترك معلّقاً على مرحلة لاحقة.
            reason: String(reason ?? "").trim() || null,
        });
        await addEvent(current, {
            stage: target,
            note: String(reason ?? "").trim() || note || null,
            actor: by || "system",
            id_user,
        });
        await mirrorLegacy(current);
        void announce(current, { payment });

        return { ok: true, flow: current, payment, stage: target, label: stageLabel(target) };
    } catch (error) {
        logger.error(`requestFlow.advanceFlow: ${error?.message || error}`);
        return { ok: false, code: "FLOW_FAILED", message: "تعذّر تنفيذ الإجراء" };
    }
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
