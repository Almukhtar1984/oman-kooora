// رسوم الطلبات ومدفوعاتها.
//
// Registering a player, moving one, lending one or registering a team costs
// money, and the amount differs from club to club. The clubs were settling it
// off the platform: a team transfers 100 ريال for several requests at once and
// the club is left guessing which request each part paid for — "ويصير خربطة",
// as the owner put it, especially in competition season when thirty teams send
// requests in a week.
//
// So the club writes its own price list, and every request that costs money
// carries its own payment: what it is for, how much is due, the receipt and its
// reference number. One payment, one request — that is the whole point.
//
// The owner's rules: the club sets the prices, payment is in full (no part
// payments), and the receipt is an image plus the transfer's reference number.
//
// Pure decisions only — no DB, no IO.

export const FEE_TYPES = [
    { type: "player_registration", label: "تسجيل لاعب" },
    { type: "transfer",            label: "انتقال لاعب" },
    { type: "loan",                label: "إعارة لاعب" },
    { type: "team_registration",   label: "تسجيل فريق" },
    { type: "player_release",      label: "استقالة لاعب" },
];

const FEE_KEYS = FEE_TYPES.map((f) => f.type);

export const feeLabel = (type) => FEE_TYPES.find((f) => f.type === type)?.label || "";

export const isFeeType = (type) => FEE_KEYS.includes(type);

export const PAYMENT_WAITING = "waiting";       // صدر الطلب وينتظر دفع الفريق
export const PAYMENT_SUBMITTED = "submitted";   // الفريق دفع ورفع الإيصال
export const PAYMENT_ACCEPTED = "accepted";     // النادي اعتمد الإيصال
export const PAYMENT_REJECTED = "rejected";     // النادي رفض الإيصال

export const PAYMENT_STATUSES = [
    PAYMENT_WAITING, PAYMENT_SUBMITTED, PAYMENT_ACCEPTED, PAYMENT_REJECTED,
];

/** A price the club may store: a number, not negative, with two decimals. */
export const normalizeAmount = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return null;
    return Math.round(amount * 100) / 100;
};

/**
 * May the team submit a receipt for this payment, and is what it sent complete?
 *
 * Payment is in full, so a receipt that admits to paying less than the due
 * amount is refused here rather than discovered later by the club.
 */
export const canSubmitReceipt = (payment, { reference_number, amount } = {}) => {
    if (!payment) {
        return { ok: false, code: "PAYMENT_NOT_FOUND", message: "طلب الدفع غير موجود" };
    }
    if (payment.status === PAYMENT_ACCEPTED) {
        return { ok: false, code: "PAYMENT_ALREADY_ACCEPTED", message: "هذا الدفع معتمد مسبقاً" };
    }
    if (!String(reference_number ?? "").trim()) {
        return { ok: false, code: "REFERENCE_REQUIRED", message: "أدخل الرقم المرجعي للتحويل" };
    }

    const paid = normalizeAmount(amount ?? payment.amount);
    const due = normalizeAmount(payment.amount);
    if (paid === null) {
        return { ok: false, code: "AMOUNT_INVALID", message: "المبلغ غير صحيح" };
    }
    if (due !== null && paid < due) {
        return {
            ok: false,
            code: "PARTIAL_PAYMENT",
            message: `المبلغ المدفوع أقل من المطلوب (${due}) — الدفع يكون كاملاً`,
        };
    }
    return { ok: true };
};

/**
 * What the club's decision does to a payment.
 *
 * A rejected payment goes back to waiting, not to a dead end: the team fixes
 * the receipt and sends it again, exactly as with a rejected registration.
 */
export const paymentDecision = (currentStatus, decision) => {
    if (currentStatus === PAYMENT_ACCEPTED) {
        return { status: currentStatus, settles: false, valid: false };
    }
    if (decision === PAYMENT_ACCEPTED) {
        return { status: PAYMENT_ACCEPTED, settles: true, valid: true };
    }
    if (decision === PAYMENT_REJECTED) {
        return { status: PAYMENT_WAITING, settles: false, valid: true, rejected: true };
    }
    return { status: currentStatus, settles: false, valid: false };
};

/**
 * إيصالٌ واحد لعدّة مطالبات — هل يجوز، وكم مجموعها؟
 *
 * موسم المسابقات: «الفريق يسوّي ثلاث إعارات وانتقال… يرسل مية ريال مرة واحدة…
 * المشكلة النادي ما يعرف هذا مال مين» (العميل). المطالبة واحدة لكل طلب أصلاً، فيكفي
 * أن يختار الفريق مطالباته ويرفع عليها إيصاله الواحد: كل مطالبة تحمل الإيصال
 * ورقمه، فيرى النادي أن العشرين لمحمد والثلاثين لمعاوية.
 *
 * الدفع كامل هنا أيضاً: التحويل لا يقلّ عن مجموع ما اختير.
 */
export const canSubmitBatchReceipt = (payments, { reference_number, amount } = {}) => {
    const list = (payments || []).filter(Boolean);
    if (!list.length) {
        return { ok: false, code: "PAYMENTS_REQUIRED", message: "اختر المطالبات التي يسدّدها الإيصال" };
    }
    const settled = list.filter((payment) => payment.status === PAYMENT_ACCEPTED || payment.status === PAYMENT_SUBMITTED);
    if (settled.length) {
        return {
            ok: false,
            code: "PAYMENT_NOT_OPEN",
            message: "بين المختار مطالبةٌ سُدّدت أو بانتظار مراجعة إيصالها",
        };
    }
    const teams = new Set(list.map((payment) => payment.id_team));
    if (teams.size > 1) {
        return { ok: false, code: "PAYMENTS_MIXED", message: "الإيصال الواحد لفريقٍ واحد" };
    }
    if (!String(reference_number ?? "").trim()) {
        return { ok: false, code: "REFERENCE_REQUIRED", message: "أدخل الرقم المرجعي للتحويل" };
    }

    const total = Math.round(list.reduce((sum, payment) => sum + (normalizeAmount(payment.amount) || 0), 0) * 100) / 100;
    const paid = normalizeAmount(amount ?? total);
    if (paid === null) return { ok: false, code: "AMOUNT_INVALID", message: "المبلغ غير صحيح" };
    if (paid < total) {
        return {
            ok: false,
            code: "PARTIAL_PAYMENT",
            message: `المبلغ المحوَّل أقل من مجموع المطالبات (${total}) — الدفع يكون كاملاً`,
        };
    }
    return { ok: true, total };
};
