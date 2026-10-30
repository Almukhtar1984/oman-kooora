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

// نصّ الزرّ الذي ينقل الطلب إلى هذه المرحلة — حين لا يقول الانتقال نصّه.
//
// اسم المرحلة يصف حالاً، والزرّ يصف فعلاً: «مقبول مبدئياً» تُقرأ خبراً، و«قبول
// مبدئي» تُقرأ أمراً — وهو ما يضغطه النادي. والهدف الواحد قد يكون فعلين: إلى
// «بانتظار السداد» يذهب الطلب بمطالبة النادي، ويعود إليه بردّ الإيصال — فلكل
// انتقال نصّه في جدوله، وهذا احتياطه.
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
// ولكل نوع رسومه. والسداد مرحلة لا يتخطّاها طلب: «جميع الأندية تعتمد على هذا
// الشيء… ما ممكن يسجّل اللاعب، انتقال اللاعب، إعارة اللاعب، استقالة اللاعب، إلا
// في الدفع الرسوم» (اجتماع 2026-10-30). والإعفاء — «إعارة مجانية» — قرار
// يتّخذه النادي صراحةً ويظهر في الخط، لا سعرٌ ناقص يُسقط المرحلة بصمت.
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

// ما يجوز الانتقال إليه من كل مرحلة، ومن يملكه، وما يحتاجه.
// الإلغاء وارد من كل مرحلة غير منتهية، فهو ليس في الجداول بل في القاعدة تحتها.
//
// kind يقول ما يحتاجه الإجراء غير السبب:
//   bill           — مبلغ الرسوم (يُقترح من قائمة أسعار النادي ويُعدَّل).
//   waive          — سبب الإعفاء («إعارة مجانية»): النادي يتجاوز السداد بقرار
//                    مكتوب يظهر في الخط، لا بسعر غائب.
//   return_receipt — ردّ إيصال لم يُقبل؛ لا يكون في طلب أُعفي من الرسوم، إذ لا
//                    إيصال فيه.
const TRANSITIONS = {
    [DRAFT]:            [{ to: SUBMITTED,        by: "team", label: "إرسال الطلب" }],
    // والرفض في المراجعة المبدئية نوعان: «مرفوض مبدئياً» يعود للفريق ليعدّل
    // ويُعيد، و«مرفوض نهائياً» يُغلق ما لا يُصلَح — وهو رفض الانتقال في سلسلة
    // الناديين، إذ لا تعديل يُعيد طلباً رفضه نادٍ.
    [SUBMITTED]:        [{ to: CLUB_PROCESSING,  by: "club", label: "قبول مبدئي" },
                         { to: REJECTED_INITIAL, by: "club", label: "رفض مبدئي (مع السبب)" },
                         { to: REJECTED_FINAL,   by: "club", label: "رفض نهائي (مع السبب)" }],
    [REJECTED_INITIAL]: [{ to: SUBMITTED,        by: "team", label: "إعادة إرسال الطلب", needsResubmit: true }],
    // لا اعتماد من هنا: «مقبول مبدئياً» يليه السداد، فالنادي يطالب أو يُعفي.
    [CLUB_PROCESSING]:  [{ to: AWAITING_PAYMENT, by: "club", label: "مطالبة بالرسوم", kind: "bill" },
                         { to: PAID_REVIEW,      by: "club", label: "إعفاء من الرسوم", kind: "waive" },
                         { to: REJECTED_FINAL,   by: "club", label: "رفض نهائي (مع السبب)" }],
    // والسداد لا يُعلنه زرّ: الفريق ينتقل من الانتظار إلى المراجعة برفع
    // الإيصال ورقمه المرجعي، فيحرّكه رفعُ الإيصال نفسه (viaReceipt). ولو كان
    // زراً لأعلن الفريق سدادَ نفسه ومضى الطلب بلا ريال.
    [AWAITING_PAYMENT]: [{ to: PAID_REVIEW,      by: "team", label: "رفع إيصال السداد", viaReceipt: true },
                         { to: REJECTED_FINAL,   by: "club", label: "رفض نهائي (مع السبب)" }],
    // ردّ الإيصال يعيد الطلب إلى السداد لا إلى طريق مسدود: يصحّح الفريق
    // إيصاله ويرسله ثانية، كما يفعل بالتسجيل المرفوض تماماً.
    [PAID_REVIEW]:      [{ to: APPROVED,         by: "club", label: "اعتماد نهائي" },
                         { to: AWAITING_PAYMENT, by: "club", label: "ردّ الإيصال للسداد", kind: "return_receipt" },
                         { to: REJECTED_FINAL,   by: "club", label: "رفض نهائي (مع السبب)" }],
    [APPROVED]:         [],
    [REJECTED_FINAL]:   [],
    [CANCELLED]:        [],
};

const CANCEL_MOVE = { to: CANCELLED, label: "إلغاء الطلب" };

const moveOf = (flow, to) => (TRANSITIONS[flow?.stage] || []).find((move) => move.to === to) || null;

/** المبلغ صالحٌ للمطالبة: رقمٌ موجبٌ بمنزلتين. */
const billable = (amount) => {
    const value = Number(amount);
    return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
};

/**
 * هل يجوز نقل الطلب من مرحلته إلى المرحلة المطلوبة، ومَن طلب ذلك؟
 *
 * ترجع {ok:true} أو {ok:false, code, message} — بنفس أسلوب بقية المساعدات،
 * فالرافض يقول سببه بلغة تُعرض للمستخدم لا رمزاً يُترجم في الواجهة.
 */
export const canAdvance = (flow, { to, by, reason, type, viaReceipt = false, amount } = {}) => {
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

    const allowed = moveOf(flow, to);
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
    // المطالبة تسمّي مبلغها — والإعفاء قرارٌ آخر له زرّه، لا مبلغٌ صفر.
    if (allowed.kind === "bill" && billable(amount) === null) {
        return {
            ok: false,
            code: "AMOUNT_REQUIRED",
            message: "حدّد مبلغ الرسوم، أو اعفِ الطلب منها صراحةً",
        };
    }
    // والإعفاء يُكتب سببه في الخط، كي لا يقرأ أحدٌ طلباً بلا رسوم فيظنّه سهواً.
    if (allowed.kind === "waive" && !String(reason ?? "").trim()) {
        return {
            ok: false,
            code: "WAIVER_REASON_REQUIRED",
            message: "اكتب سبب الإعفاء — مثل «إعارة مجانية»",
        };
    }
    if (allowed.kind === "return_receipt" && flow.fee_waived) {
        return {
            ok: false,
            code: "FEE_WAIVED",
            message: "أُعفي هذا الطلب من الرسوم، فلا إيصال يُردّ",
        };
    }
    return { ok: true };
};

/**
 * ما يجوز لهذا الطرف فعله الآن، بما يحتاجه كل إجراء — تُبنى منه الأزرار، فلا
 * يُعرض زرّ يُرفض ضغطه.
 *
 * الإجراء الذي يملكه الإيصال لا يُعرض زرّاً: يُرفع الإيصال فيتحرّك الطلب.
 */
export const availableActions = (flow, by) => {
    if (!flow || isDone(flow.stage) || (by !== "team" && by !== "club")) return [];

    const moves = (TRANSITIONS[flow.stage] || [])
        .filter((move) => move.by === by && !move.viaReceipt)
        .filter((move) => !(move.kind === "return_receipt" && flow.fee_waived))
        .filter((move) => !(move.needsResubmit && !allowsResubmit(flow.request_type)));

    return [...moves, CANCEL_MOVE].map((move) => ({
        to: move.to,
        label: move.label || actionLabel(move.to),
        kind: move.kind || null,
        needsReason: Boolean(stageInfo(move.to)?.needsReason) || move.kind === "waive",
        needsAmount: move.kind === "bill",
    }));
};

/**
 * المبلغ الذي يُقترح على النادي حين يطالب: سعره المفعّل لهذا النوع، أو لا شيء.
 *
 * كان غياب السعر يُسقط مرحلة السداد كلها فيُعتمد الطلب بلا رسوم — وهو ما رآه
 * العميل في استقالةٍ مرّت من «مقبول مبدئياً» إلى «معتمد نهائياً». الآن السعر
 * اقتراحٌ يملأ الحقل، والنادي يطالب بمبلغ أو يُعفي بسبب.
 */
export const suggestedFee = ({ type, fee } = {}) => {
    if (!requestTypeInfo(type)?.fee) return null;
    if (!fee || !fee.active) return null;
    return billable(fee.amount);
};

/** المبلغ إن صلح للمطالبة، وإلا null. */
export const billableAmount = billable;

/**
 * المرحلة التي يبدأ منها طلبٌ أنشأه النادي بنفسه.
 *
 * النادي الذي يُعير لاعبه أو يسجّله قد قَبِله بفعله، فلا يقف الطلب بانتظار
 * مراجعته المبدئية — لكنه لا يُعتمد بذلك: يبدأ من «مقبول مبدئياً» ويمرّ بالرسوم
 * والاعتماد كغيره. كانت إعارة النادي تولد معتمدة فلا يراها مسار الطلبات أصلاً.
 */
export const openingStage = ({ byClub = false } = {}) => (byClub ? CLUB_PROCESSING : SUBMITTED);

/**
 * المسمّى الذي يُعرض لمرحلةٍ في طلبٍ بعينه.
 *
 * «تم السداد — بانتظار مراجعة النادي» خبرٌ كاذب عن طلبٍ أُعفي من الرسوم.
 */
export const stageLabelFor = (stage, flow = null) =>
    stage === PAID_REVIEW && flow?.fee_waived
        ? "أُعفي من الرسوم — بانتظار الاعتماد النهائي"
        : stageLabel(stage);

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
    transfer:       ["waiting", "waiting_club_from", "waiting_club_to", "waiting_payment", "accepted", "rejected"],
};

// بعد أن يتّفق الناديان يبقى للانتقال رسومه واعتماده: waiting_payment تقول
// ذلك لشاشاته القائمة، فلا يظهر لها «بانتظار النادي» بزرّي قبول ورفض قد بُتّ
// فيهما — ولا «مقبول» واللاعب لم ينتقل بعد.
const TRANSFER_AFTER_CHAIN = [CLUB_PROCESSING, AWAITING_PAYMENT, PAID_REVIEW];

export const legacyStatus = (stage) => LEGACY[stage] || null;

/**
 * الحالة القديمة التي تُكتب في سجلّ الطلب نفسه، بحسب نوعه.
 *
 * ترجع null حين لا يُكتب شيء: الانتقال يدير سلسلته بين الناديين بنفسه قبل
 * اتفاقهما، فلا يصحّ أن يدوس عليها المسار — يكتب ما بعدها فقط.
 */
export const legacyStatusFor = (entityType, stage) => {
    const mapped = LEGACY[stage];
    if (!mapped) return null;

    const allowed = LEGACY_VALUES[entityType];
    if (!allowed) return null;

    if (entityType === "transfer" && !isDone(stage)) {
        // قبل اتفاق الناديين السلسلةُ تدير حالتها بنفسها.
        return TRANSFER_AFTER_CHAIN.includes(stage) ? "waiting_payment" : null;
    }

    if (allowed.includes(mapped)) return mapped;
    // لا تعرف هذا السجلّ waiting_club، فانتظاره انتظار.
    return allowed.includes("waiting") ? "waiting" : null;
};

/**
 * ما تفعله نهاية الطريق بالطلب نفسه.
 *
 * الأثر — اللاعب يُفعَّل، أو ينتقل، أو يُخلى طرفه — يقع عند الاعتماد النهائي
 * وحده. كان الانتقال يُنفَّذ لحظة اتفاق الناديين والرسوم بعده مطالبةٌ لا بوابة؛
 * والعميل: «لا يمرّ أي مرحلة إلا لازم موافقة النادي والنادي أخذ رسوم».
 *
 *   finalize — الانتقال/الإعارة: اللاعب إلى فريقه الجديد.
 *   abandon  — الانتقال/الإعارة: الطلب يسقط واللاعب باقٍ في فريقه.
 *   release  — الاستقالة: يُخلى طرف اللاعب من فريقه.
 *   refuse   — الاستقالة: تُرفض ويبقى.
 * والتسجيل تكفيه المرآة: الاعتماد يجعل اللاعب accepted.
 */
export const outcomeOf = (entityType, stage) => {
    if (entityType === "transfer") {
        if (stage === APPROVED) return "finalize";
        if (stage === REJECTED_FINAL || stage === CANCELLED) return "abandon";
    }
    if (entityType === "player_release") {
        if (stage === APPROVED) return "release";
        if (stage === REJECTED_FINAL || stage === CANCELLED) return "refuse";
    }
    return null;
};

/**
 * زرّا «قبول» و«رفض» في الصفحات القديمة — إلى أين يأخذان الطلب على الطريق؟
 *
 * صفحات اللاعبين والإعارات وإخلاء الطرف كانت تكتب الحالة مباشرة فتتخطّى المسار:
 * يُقبل اللاعب من بطاقته فيُفعَّل بلا رسوم، والخط واقفٌ عند «مقدم من الفريق».
 * فالزرّان الآن يُترجمان إلى خطوة على الطريق نفسه: القبول هو الخطوة التالية
 * التي يملكها النادي، والرفض رفضٌ بسببه — وحيث لا يملك النادي الخطوة يُقال له
 * لماذا، بدل أن يبدو الزرّ معطّلاً.
 *
 * @param {string} stage    مرحلة الطلب الآن
 * @param {"accepted"|"rejected"} decision
 * @returns {{ to: string } | { code: string, message: string }}
 */
export const legacyDecisionMove = (stage, decision) => {
    if (isDone(stage)) {
        return { code: "FLOW_CLOSED", message: `الطلب ${stageLabel(stage)} ولا يقبل إجراءً جديداً` };
    }
    if (decision === "rejected") {
        if (stage === SUBMITTED) return { to: REJECTED_INITIAL };
        if (stage === REJECTED_INITIAL) {
            return { code: "ALREADY_REJECTED", message: "الطلب مرفوض مبدئياً وبانتظار تعديل الفريق" };
        }
        return { to: REJECTED_FINAL };
    }
    if (decision !== "accepted") {
        return { code: "DECISION_INVALID", message: "قرار غير مفهوم — قبول أو رفض" };
    }
    switch (stage) {
        case SUBMITTED:
            return { to: CLUB_PROCESSING };
        case PAID_REVIEW:
            return { to: APPROVED };
        case CLUB_PROCESSING:
            return {
                code: "FEE_DECISION_PENDING",
                message: "قُبل الطلب مبدئياً — طالِب بالرسوم أو اعفِه منها من مسار الطلبات",
            };
        case AWAITING_PAYMENT:
            return { code: "AWAITING_PAYMENT", message: "الطلب بانتظار سداد الفريق للرسوم" };
        case REJECTED_INITIAL:
            return { code: "AWAITING_TEAM", message: "الطلب مرفوض مبدئياً وبانتظار تعديل الفريق" };
        default:
            return { code: "DECISION_INVALID", message: "لا يُقبل الطلب من مرحلته هذه" };
    }
};
