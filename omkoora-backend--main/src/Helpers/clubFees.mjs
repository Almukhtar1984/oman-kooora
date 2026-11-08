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

// قائمة الأسعار. «في تسجيل اللاعب حالتين: فوق 18 سنة وتحت 18 سنة… إعارة اللاعب
// الداخلي وإعارة اللاعب الخارجي، مبلغ مختلف» (العميل، 2026-11-05).
//
// label اسمها في قائمة الأسعار، و bill اسمها في المطالبة حيث يختلف: المطالبات
// القديمة بنوع «إعارة» لم تكن تفرّق بين داخلية وخارجية، فتبقى «إعارة لاعب» ولا
// تُنسب إلى ما لم تكنه.
export const FEE_TYPES = [
    { type: "player_registration",         label: "تسجيل لاعب — فوق 18 سنة", bill: "تسجيل لاعب" },
    { type: "player_registration_under18", label: "تسجيل لاعب — تحت 18 سنة", bill: "تسجيل لاعب تحت 18 سنة" },
    { type: "transfer",                    label: "انتقال لاعب — داخلي",     bill: "انتقال لاعب" },
    { type: "transfer_external",           label: "انتقال لاعب — خارجي",     bill: "انتقال لاعب خارجي" },
    { type: "loan",                        label: "إعارة لاعب — داخلية",     bill: "إعارة لاعب" },
    { type: "loan_external",               label: "إعارة لاعب — خارجية",     bill: "إعارة لاعب خارجية" },
    { type: "team_registration",           label: "تسجيل فريق" },
    { type: "player_release",              label: "استقالة لاعب" },
    { type: "competition_registration",    label: "تسجيل في المسابقات" },
    // «هذا العضو يدفع سنوياً للنادي» (العميل، 2026-11-08) — يُطلب مع «تسجيل عضو جديد».
    { type: "member_registration",         label: "رسوم العضوية السنوية",   bill: "رسوم العضوية" },
];

const FEE_KEYS = FEE_TYPES.map((f) => f.type);

const feeOf = (type) => FEE_TYPES.find((f) => f.type === type);

/** اسم الرسوم في المطالبة والإشعار والإيصال. */
export const feeLabel = (type) => feeOf(type)?.bill || feeOf(type)?.label || "";

/** اسمها في قائمة أسعار النادي. */
export const priceLabel = (type) => feeOf(type)?.label || "";

export const isFeeType = (type) => FEE_KEYS.includes(type);

const toAsciiDigits = (text) => text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

/**
 * العمر بالسنوات يوم الطلب، أو null حين لا يُقرأ التاريخ.
 *
 * تاريخ الميلاد حقلٌ نصّي: تكتبه النماذج YYYY-MM-DD، وفي الصفوف القديمة والمستوردة
 * DD/MM/YYYY وأرقام عربية.
 */
export const ageOn = (birth, now = new Date()) => {
    if (birth === null || birth === undefined || birth === "") return null;
    const text = toAsciiDigits(birth instanceof Date ? birth.toISOString() : String(birth)).trim();
    let parts = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:$|[T\s])/);
    let [year, month, day] = parts ? [+parts[1], +parts[2], +parts[3]] : [];
    if (!parts) {
        parts = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
        if (!parts) return null;
        [day, month, year] = +parts[2] > 12 ? [+parts[2], +parts[1], +parts[3]] : [+parts[1], +parts[2], +parts[3]];
    }
    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const before = now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day);
    return now.getFullYear() - year - (before ? 1 : 0);
};

/** انتقالٌ أو إعارة تخرج من النادي إلى نادٍ آخر؟ */
export const isExternalMove = (transfer) => Boolean(transfer) && (
    transfer.type === "external"
    || Boolean(transfer.id_club_from && transfer.id_club_to && transfer.id_club_from !== transfer.id_club_to)
);

/**
 * أيّ سعر يخصّ هذا الطلب بعينه. وعمرٌ لا يُقرأ يبقى على السعر العام: المبلغ اقتراح
 * يراه النادي قبل أن يطالب، ولا يُفترض أن اللاعب قاصر.
 */
export const feeTypeFor = (requestType, { birth = null, external = false, now = new Date() } = {}) => {
    if (requestType === "player_registration") {
        const age = ageOn(birth, now);
        return age !== null && age < 18 ? "player_registration_under18" : "player_registration";
    }
    if (requestType === "transfer" || requestType === "loan") {
        return external ? `${requestType}_external` : requestType;
    }
    return requestType;
};

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
