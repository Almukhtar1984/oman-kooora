// مسار الطلب — الطريق الواحد الذي تسلكه طلبات الفريق الأربعة.
//
// تسجيل لاعب، انتقاله، إعارته، واستقالته: أربعة طلبات كانت لكل واحد منها
// حالاته الخاصة، فالفريق يقدّم ثم لا يدري أين وقف طلبه — «يعني الرجّال ما يدري
// اتخذ قرار ولا لا». وهذا الملف هو الطريق الواحد: مراحله، وما يجوز الانتقال
// إليه من كل مرحلة، ومن يملك الانتقال.
//
// المالك عدّ اثنتي عشرة حالة، وثلاثة أزواج منها لحظة واحدة مسمّاة مرتين بنصّه
// هو: «مقدم من الفريق» هي نفسها «بانتظار المراجعة المبدئية» (يقدّم فيُرسل
// تلقائياً فتظهر الحالة)، و«مقبول مبدئياً» هي نفسها «قيد استكمال إجراءات
// النادي» (القبول المبدئي ينقله إلى الاستكمال)، و«تم السداد – بانتظار مراجعة
// النادي» هي نفسها «بانتظار الاعتماد النهائي». فلو خُزّنت كلٌّ منها مرحلةً
// قائمة بذاتها لصارت ثلاث مراحل لا يخرج منها الطلب، إذ لا إجراء يستهدفها.
// فالمراحل المخزّنة تسع، وكل مرحلة تحمل مسمّياتها كما سمّاها هو — الخط يعرضها،
// والآلة لا تضيع فيها.
//
// قرارات محضة: لا قاعدة بيانات ولا إدخال/إخراج.

export const DRAFT            = "draft";
export const SUBMITTED        = "submitted";
export const REJECTED_INITIAL = "rejected_initial";
export const CLUB_PROCESSING  = "club_processing";
export const AWAITING_PAYMENT = "awaiting_payment";
export const PAID_REVIEW      = "paid_review";
export const APPROVED         = "approved";
export const REJECTED_FINAL   = "rejected_final";
export const CANCELLED        = "cancelled";

// المرحلة، ومسمّاها الذي يظهر للفريق، والمسمّى المرادف الذي سمّاه به المالك
// أيضاً — يظهر تحته في الخط حتى يقرأ الطرفان الشيء نفسه.
export const STAGES = [
    {
        stage: DRAFT,
        label: "مسودة",
        also: null,
        actor: "team",
        done: false,
    },
    {
        stage: SUBMITTED,
        label: "مقدم من الفريق",
        also: "بانتظار المراجعة المبدئية من النادي",
        actor: "club",
        done: false,
    },
    {
        stage: REJECTED_INITIAL,
        label: "مرفوض مبدئياً — يتطلب المعالجة",
        also: null,
        actor: "team",
        done: false,
        needsReason: true,
    },
    {
        stage: CLUB_PROCESSING,
        label: "مقبول مبدئياً",
        also: "قيد استكمال إجراءات النادي",
        actor: "club",
        done: false,
    },
    {
        stage: AWAITING_PAYMENT,
        label: "بانتظار سداد الرسوم",
        also: null,
        actor: "team",
        done: false,
    },
    {
        stage: PAID_REVIEW,
        label: "تم السداد — بانتظار مراجعة النادي",
        also: "بانتظار الاعتماد النهائي",
        actor: "club",
        done: false,
    },
    {
        stage: APPROVED,
        label: "معتمد نهائياً",
        also: null,
        actor: null,
        done: true,
    },
    {
        stage: REJECTED_FINAL,
        label: "مرفوض نهائياً",
        also: null,
        actor: null,
        done: true,
        needsReason: true,
    },
    {
        stage: CANCELLED,
        label: "ملغي",
        also: null,
        actor: null,
        done: true,
    },
];

const BY_STAGE = new Map(STAGES.map((s) => [s.stage, s]));

// نصّ الزرّ الذي ينقل الطلب إلى هذه المرحلة.
//
// اسم المرحلة يصف حالاً، والزرّ يصف فعلاً: «مقبول مبدئياً» تُقرأ خبراً، و«قبول
// مبدئي» تُقرأ أمراً — وهو ما يضغطه النادي.
const ACTION_LABELS = {
    [SUBMITTED]:        "إعادة إرسال الطلب",
    [CLUB_PROCESSING]:  "قبول مبدئي",
    [REJECTED_INITIAL]: "رفض مبدئي (مع السبب)",
    [AWAITING_PAYMENT]: "مطالبة بالرسوم",
    [PAID_REVIEW]:      "تأكيد السداد",
    [APPROVED]:         "اعتماد نهائي",
    [REJECTED_FINAL]:   "رفض نهائي (مع السبب)",
    [CANCELLED]:        "إلغاء الطلب",
};

export const actionLabel = (stage) => ACTION_LABELS[stage] || stageLabel(stage);

export const stageInfo  = (stage) => BY_STAGE.get(stage) || null;
export const stageLabel = (stage) => BY_STAGE.get(stage)?.label || "";
export const isStage    = (stage) => BY_STAGE.has(stage);
export const isDone     = (stage) => Boolean(BY_STAGE.get(stage)?.done);

// أنواع الطلبات التي تسلك هذا الطريق، ونوع الرسوم المقابل لكل منها.
//
// ولكل نوع رسومه، لأن المالك قال «الرسوم المستحقة، إن وجدت» — فوجودها قرار
// النادي حين يسعّر، لا قرارنا هنا. ونادٍ لم يسعّر نوعاً يمضي طلبه إلى الاعتماد
// بلا مرور بالسداد.
//
// resubmit: هل يُعدَّل الطلب ويُعاد إرساله بعد رفضه مبدئياً؟ قال «إذا كانت
// طبيعة الطلب تسمح بذلك» ولم يسمِّ أيّها لا يسمح، فالأربعة تسمح حتى يحدّد —
// والمنع بعدها كلمة واحدة في سطر النوع.
export const REQUEST_TYPES = [
    { type: "player_registration", label: "تسجيل لاعب جديد", entity: "player",         fee: "player_registration", resubmit: true },
    { type: "transfer",            label: "انتقال لاعب",      entity: "transfer",       fee: "transfer",            resubmit: true },
    { type: "loan",                label: "إعارة لاعب",       entity: "transfer",       fee: "loan",                resubmit: true },
    { type: "player_release",      label: "استقالة لاعب",     entity: "player_release", fee: "player_release",      resubmit: true },
];

const BY_TYPE = new Map(REQUEST_TYPES.map((t) => [t.type, t]));

export const requestTypeInfo  = (type) => BY_TYPE.get(type) || null;
export const requestTypeLabel = (type) => BY_TYPE.get(type)?.label || "";
export const isRequestType    = (type) => BY_TYPE.has(type);

// هل يجوز للفريق تعديل الطلب وإعادة إرساله بعد الرفض المبدئي؟
// «إذا كانت طبيعة الطلب تسمح بذلك» — ولم يسمِّ نوعاً لا يسمح، فالأربعة تسمح
// (انظر resubmit في REQUEST_TYPES)، والمنع كلمة واحدة في سطر النوع.
export const allowsResubmit = (type) => Boolean(BY_TYPE.get(type)?.resubmit);

// ما يجوز الانتقال إليه من كل مرحلة، ومن يملكه.
// الإلغاء وارد من كل مرحلة غير منتهية، فهو ليس في الجداول بل في القاعدة تحتها.
const TRANSITIONS = {
    [DRAFT]:            [{ to: SUBMITTED,        by: "team" }],
    [SUBMITTED]:        [{ to: CLUB_PROCESSING,  by: "club" },
                         { to: REJECTED_INITIAL, by: "club" }],
    [REJECTED_INITIAL]: [{ to: SUBMITTED,        by: "team", needsResubmit: true }],
    [CLUB_PROCESSING]:  [{ to: AWAITING_PAYMENT, by: "club" },
                         // بلا رسوم مسعّرة يمضي النادي إلى الاعتماد مباشرة.
                         { to: APPROVED,         by: "club" },
                         { to: REJECTED_FINAL,   by: "club" }],
    // والسداد لا يُعلنه زرّ: الفريق ينتقل من الانتظار إلى المراجعة برفع
    // الإيصال ورقمه المرجعي، فيحرّكه رفعُ الإيصال نفسه (viaReceipt). ولو كان
    // زراً لأعلن الفريق سدادَ نفسه ومضى الطلب بلا ريال.
    [AWAITING_PAYMENT]: [{ to: PAID_REVIEW,      by: "team", viaReceipt: true },
                         { to: REJECTED_FINAL,   by: "club" }],
    // رفض الإيصال يعيد الطلب إلى السداد لا إلى طريق مسدود: يصحّح الفريق
    // إيصاله ويرسله ثانية، كما يفعل بالتسجيل المرفوض تماماً.
    [PAID_REVIEW]:      [{ to: APPROVED,         by: "club" },
                         { to: AWAITING_PAYMENT, by: "club" },
                         { to: REJECTED_FINAL,   by: "club" }],
    [APPROVED]:         [],
    [REJECTED_FINAL]:   [],
    [CANCELLED]:        [],
};

/**
 * هل يجوز نقل الطلب من مرحلته إلى المرحلة المطلوبة، ومَن طلب ذلك؟
 *
 * ترجع {ok:true} أو {ok:false, code, message} — بنفس أسلوب بقية المساعدات،
 * فالرافض يقول سببه بلغة تُعرض للمستخدم لا رمزاً يُترجم في الواجهة.
 */
export const canAdvance = (flow, { to, by, reason, type, viaReceipt = false } = {}) => {
    if (!flow) {
        return { ok: false, code: "FLOW_NOT_FOUND", message: "مسار الطلب غير موجود" };
    }
    if (!isStage(to)) {
        return { ok: false, code: "STAGE_INVALID", message: "مرحلة غير معروفة" };
    }

    const from = flow.stage;
    if (isDone(from)) {
        return {
            ok: false,
            code: "FLOW_CLOSED",
            message: `الطلب ${stageLabel(from)} ولا يقبل إجراءً جديداً`,
        };
    }

    // الإلغاء متاح من أي مرحلة غير منتهية، ولصاحب الطلب أو النادي.
    if (to === CANCELLED) {
        if (by !== "team" && by !== "club") {
            return { ok: false, code: "FLOW_FORBIDDEN", message: "لا تملك إلغاء هذا الطلب" };
        }
        return { ok: true };
    }

    const allowed = (TRANSITIONS[from] || []).find((move) => move.to === to);
    if (!allowed) {
        return {
            ok: false,
            code: "STAGE_TRANSITION_INVALID",
            message: `لا يمكن الانتقال من «${stageLabel(from)}» إلى «${stageLabel(to)}»`,
        };
    }
    if (allowed.by !== by) {
        return {
            ok: false,
            code: "FLOW_FORBIDDEN",
            message: allowed.by === "club"
                ? "هذا الإجراء من حق النادي"
                : "هذا الإجراء من حق الفريق",
        };
    }
    // انتقالٌ يملكه الإيصال لا الزرّ.
    if (allowed.viaReceipt && !viaReceipt) {
        return {
            ok: false,
            code: "RECEIPT_REQUIRED",
            message: "السداد يُسجَّل برفع الإيصال ورقمه المرجعي",
        };
    }
    // إعادة الإرسال بعد رفض مبدئي — وليس كل طلب يقبلها.
    if (allowed.needsResubmit && type && !allowsResubmit(type)) {
        return {
            ok: false,
            code: "RESUBMIT_NOT_ALLOWED",
            message: `لا تقبل «${requestTypeLabel(type)}» التعديل وإعادة الإرسال`,
        };
    }
    // الرفض بلا سبب هو ما يشكو منه الفريق أصلاً.
    if (stageInfo(to)?.needsReason && !String(reason ?? "").trim()) {
        return { ok: false, code: "REASON_REQUIRED", message: "اكتب سبب الرفض" };
    }
    return { ok: true };
};

/**
 * إلى أين يذهب الطلب بعد أن يستكمل النادي إجراءاته؟
 *
 * إلى السداد إن كان لنوعه سعر مفعّل عند النادي، وإلى الاعتماد النهائي مباشرة
 * إن لم يكن — فلا يُحبس طلب في انتظار رسوم لم يسعّرها أحد.
 */
export const afterProcessing = ({ type, fee } = {}) => {
    const feeType = requestTypeInfo(type)?.fee;
    if (!feeType) return APPROVED;
    const amount = Number(fee?.amount);
    if (!fee || !fee.active || !Number.isFinite(amount) || amount <= 0) return APPROVED;
    return AWAITING_PAYMENT;
};

// الحالة القديمة المقابلة لكل مرحلة.
//
// الشاشات القائمة تقرأ عمود status في سجلّ اللاعب أو الانتقال — مئة وتسعة
// وستون موضعاً في ستين ملفاً — فلا يُمَسّ. يبقى مرآةً تُشتقّ من المرحلة، كي
// يمشي المسار الجديد دون أن تنكسر شاشة واحدة قائمة.
const LEGACY = {
    [DRAFT]:            "waiting",
    [SUBMITTED]:        "waiting_club",
    [REJECTED_INITIAL]: "rejected",
    [CLUB_PROCESSING]:  "waiting_club",
    [AWAITING_PAYMENT]: "waiting_club",
    [PAID_REVIEW]:      "waiting_club",
    [APPROVED]:         "accepted",
    [REJECTED_FINAL]:   "rejected",
    [CANCELLED]:        "rejected",
};

// ولكل سجلّ قيمه المسموحة، وهي ليست واحدة: سجلّ اللاعب يعرف waiting_club،
// والاستقالة لا تعرفها، والانتقال له سلسلته الخاصة بين ناديين. فمرآة واحدة
// لجميعها كانت تكتب قيمة خارج الـ enum فيسقط التحديث صامتاً.
const LEGACY_VALUES = {
    player:         ["waiting", "waiting_club", "accepted", "rejected", "suspended"],
    player_release: ["waiting", "accepted", "rejected"],
    transfer:       ["waiting", "waiting_club_from", "waiting_club_to", "accepted", "rejected"],
};

export const legacyStatus = (stage) => LEGACY[stage] || null;

/**
 * الحالة القديمة التي تُكتب في سجلّ الطلب نفسه، بحسب نوعه.
 *
 * ترجع null حين لا يُكتب شيء: الانتقال يدير سلسلته بين الناديين بنفسه قبل
 * الاعتماد، فلا يصحّ أن يدوس عليها المسار — يكتب نهايتها فقط.
 */
export const legacyStatusFor = (entityType, stage) => {
    const mapped = LEGACY[stage];
    if (!mapped) return null;

    const allowed = LEGACY_VALUES[entityType];
    if (!allowed) return null;

    if (entityType === "transfer" && !isDone(stage)) return null;

    if (allowed.includes(mapped)) return mapped;
    // لا تعرف هذا السجلّ waiting_club، فانتظاره انتظار.
    return allowed.includes("waiting") ? "waiting" : null;
};
