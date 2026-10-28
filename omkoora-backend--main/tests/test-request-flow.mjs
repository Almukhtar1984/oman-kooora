// مسار الطلب — المراحل التسع التي تسلكها طلبات الفريق الأربعة،
// كما وصفها المالك: تقديم، مراجعة مبدئية، سداد رسوم، اعتماد نهائي.

import {
    STAGES, REQUEST_TYPES, stageLabel, stageInfo, isStage, isDone,
    requestTypeLabel, isRequestType, allowsResubmit,
    canAdvance, afterProcessing, legacyStatus, legacyStatusFor,
    DRAFT, SUBMITTED, REJECTED_INITIAL, CLUB_PROCESSING,
    AWAITING_PAYMENT, PAID_REVIEW, APPROVED, REJECTED_FINAL, CANCELLED,
} from "../src/Helpers/requestFlow.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};
const at = (stage) => ({ stage });

// ——— المراحل ومسمّياتها ———
check("تسع مراحل مخزّنة لا اثنتا عشرة", STAGES.length, 9);
check("والمراحل التي سمّاها مرتين تحمل المسمّيين",
    [stageInfo(SUBMITTED).also, stageInfo(CLUB_PROCESSING).also, stageInfo(PAID_REVIEW).also],
    ["بانتظار المراجعة المبدئية من النادي", "قيد استكمال إجراءات النادي", "بانتظار الاعتماد النهائي"]);
check("ومسمّى الرفض المبدئي يقول للفريق ماذا يفعل",
    stageLabel(REJECTED_INITIAL), "مرفوض مبدئياً — يتطلب المعالجة");
check("مرحلة مجهولة تُرفض", isStage("waiting_forever"), false);
check("المنتهية ثلاث: اعتماد ورفض نهائي وإلغاء",
    STAGES.filter((s) => s.done).map((s) => s.stage), [APPROVED, REJECTED_FINAL, CANCELLED]);

// ——— أنواع الطلبات الأربعة ———
check("الأنواع الأربعة التي عدّها", REQUEST_TYPES.map((t) => t.type),
    ["player_registration", "transfer", "loan", "player_release"]);
check("ولكل نوع اسمه", requestTypeLabel("player_release"), "استقالة لاعب");
check("نوع مجهول يُرفض", isRequestType("friendly_match"), false);
check("ولكل نوع رسومه، فوجودها قرار النادي حين يسعّر",
    REQUEST_TYPES.map((t) => t.fee),
    ["player_registration", "transfer", "loan", "player_release"]);

// ——— الطريق الطبيعي كاملاً ———
check("المسودة تُقدَّم", canAdvance(at(DRAFT), { to: SUBMITTED, by: "team" }).ok, true);
check("والنادي يقبلها مبدئياً", canAdvance(at(SUBMITTED), { to: CLUB_PROCESSING, by: "club" }).ok, true);
check("ثم يطالب بالرسوم", canAdvance(at(CLUB_PROCESSING), { to: AWAITING_PAYMENT, by: "club" }).ok, true);
check("ويسدّد الفريق برفع إيصاله",
    canAdvance(at(AWAITING_PAYMENT), { to: PAID_REVIEW, by: "team", viaReceipt: true }).ok, true);
check("فيعتمد النادي نهائياً", canAdvance(at(PAID_REVIEW), { to: APPROVED, by: "club" }).ok, true);

// ——— من يملك الإجراء ———
check("الفريق لا يقبل طلبه بنفسه",
    canAdvance(at(SUBMITTED), { to: CLUB_PROCESSING, by: "team" }).code, "FLOW_FORBIDDEN");
check("ورسالتها تسمّي صاحب الحق",
    canAdvance(at(SUBMITTED), { to: CLUB_PROCESSING, by: "team" }).message, "هذا الإجراء من حق النادي");
check("والنادي لا يسدّد عن الفريق",
    canAdvance(at(AWAITING_PAYMENT), { to: PAID_REVIEW, by: "club" }).code, "FLOW_FORBIDDEN");
// ——— السداد يملكه الإيصال، لا زرّ ———
// ولو كان زراً لأعلن الفريق سدادَ نفسه ومضى الطلب بلا ريال.
check("الفريق لا يعلن سداده بزرّ",
    canAdvance(at(AWAITING_PAYMENT), { to: PAID_REVIEW, by: "team" }).code, "RECEIPT_REQUIRED");
check("ورسالتها تقول كيف يُسجَّل",
    canAdvance(at(AWAITING_PAYMENT), { to: PAID_REVIEW, by: "team" }).message,
    "السداد يُسجَّل برفع الإيصال ورقمه المرجعي");
check("ولا يمنحه إيصالُ النادي نيابةً عنه",
    canAdvance(at(AWAITING_PAYMENT), { to: PAID_REVIEW, by: "club", viaReceipt: true }).code,
    "FLOW_FORBIDDEN");
check("ولا يفتح الإيصال انتقالاً آخر",
    canAdvance(at(SUBMITTED), { to: CLUB_PROCESSING, by: "team", viaReceipt: true }).code,
    "FLOW_FORBIDDEN");

// ——— الرفض لا يكون بلا سبب ———
check("رفض مبدئي بلا سبب مرفوض",
    canAdvance(at(SUBMITTED), { to: REJECTED_INITIAL, by: "club" }).code, "REASON_REQUIRED");
check("وبسبب يمر",
    canAdvance(at(SUBMITTED), { to: REJECTED_INITIAL, by: "club", reason: "الصورة غير واضحة" }).ok, true);
check("ورفض نهائي بلا سبب مرفوض كذلك",
    canAdvance(at(CLUB_PROCESSING), { to: REJECTED_FINAL, by: "club", reason: "   " }).code, "REASON_REQUIRED");

// ——— إعادة الإرسال بعد الرفض المبدئي ———
check("المرفوض مبدئياً يُعدَّل ويُرسل ثانية",
    canAdvance(at(REJECTED_INITIAL), { to: SUBMITTED, by: "team", type: "player_registration" }).ok, true);
check("والأربعة تقبلها حتى يحدّد المالك أيّها لا يقبل",
    REQUEST_TYPES.map((t) => allowsResubmit(t.type)), [true, true, true, true]);
check("والمنع — حين يُحدَّد — يردّ بسببه",
    canAdvance(at(REJECTED_INITIAL), { to: SUBMITTED, by: "team", type: "unknown_type" }).code,
    "RESUBMIT_NOT_ALLOWED");

// ——— رفض الإيصال يعيد للسداد لا إلى طريق مسدود ———
check("النادي يردّ الإيصال فيعود الطلب للسداد",
    canAdvance(at(PAID_REVIEW), { to: AWAITING_PAYMENT, by: "club" }).ok, true);

// ——— ما لا يجوز ———
check("لا قفز من التقديم إلى الاعتماد",
    canAdvance(at(SUBMITTED), { to: APPROVED, by: "club" }).code, "STAGE_TRANSITION_INVALID");
check("ورسالتها تسمّي المرحلتين",
    canAdvance(at(SUBMITTED), { to: APPROVED, by: "club" }).message,
    "لا يمكن الانتقال من «مقدم من الفريق» إلى «معتمد نهائياً»");
check("ولا رجوع بعد الاعتماد النهائي",
    canAdvance(at(APPROVED), { to: AWAITING_PAYMENT, by: "club" }).code, "FLOW_CLOSED");
check("ورسالتها تقول أين انتهى", canAdvance(at(APPROVED), { to: SUBMITTED, by: "team" }).message,
    "الطلب معتمد نهائياً ولا يقبل إجراءً جديداً");
check("ولا بعث لطلب ملغى", canAdvance(at(CANCELLED), { to: SUBMITTED, by: "team" }).code, "FLOW_CLOSED");
check("ومرحلة غير معروفة تُرفض", canAdvance(at(SUBMITTED), { to: "nowhere", by: "club" }).code, "STAGE_INVALID");

// ——— الإلغاء ———
check("الإلغاء متاح للفريق قبل الانتهاء", canAdvance(at(AWAITING_PAYMENT), { to: CANCELLED, by: "team" }).ok, true);
check("وللنادي كذلك", canAdvance(at(SUBMITTED), { to: CANCELLED, by: "club" }).ok, true);
check("ولا يُلغى المعتمد", canAdvance(at(APPROVED), { to: CANCELLED, by: "club" }).code, "FLOW_CLOSED");

// ——— بعد استكمال الإجراءات: رسوم أم اعتماد مباشر؟ ———
check("سعر مفعّل يحوّله للسداد",
    afterProcessing({ type: "transfer", fee: { active: true, amount: 20 } }), AWAITING_PAYMENT);
check("وسعر موقوف يمضي للاعتماد",
    afterProcessing({ type: "transfer", fee: { active: false, amount: 20 } }), APPROVED);
check("وسعر صفر لا يحبس الطلب",
    afterProcessing({ type: "transfer", fee: { active: true, amount: 0 } }), APPROVED);
check("ونادٍ لم يسعّر أصلاً", afterProcessing({ type: "transfer", fee: null }), APPROVED);
check("والاستقالة تمرّ بالسداد إن سعّرها النادي",
    afterProcessing({ type: "player_release", fee: { active: true, amount: 5 } }), AWAITING_PAYMENT);
check("ونوع مجهول لا يطالَب برسوم", afterProcessing({ type: "x", fee: { active: true, amount: 9 } }), APPROVED);

// ——— مرآة الحالة القديمة: الشاشات القائمة لا تنكسر ———
check("المعتمد نهائياً هو accepted القديمة", legacyStatus(APPROVED), "accepted");
check("وكل انتظار عند النادي waiting_club",
    [CLUB_PROCESSING, AWAITING_PAYMENT, PAID_REVIEW].map(legacyStatus),
    ["waiting_club", "waiting_club", "waiting_club"]);
check("والمرفوض مبدئياً يظهر مرفوضاً في الشاشات القديمة", legacyStatus(REJECTED_INITIAL), "rejected");
check("ولكل مرحلة مرآة", STAGES.every((s) => legacyStatus(s.stage) !== null), true);

// ——— ولكل سجلّ قيمه: مرآة واحدة لجميعها تكتب خارج الـ enum ———
check("سجلّ اللاعب يعرف waiting_club", legacyStatusFor("player", CLUB_PROCESSING), "waiting_club");
check("والاستقالة لا تعرفها فانتظارها انتظار",
    legacyStatusFor("player_release", CLUB_PROCESSING), "waiting");
check("والانتقال يدير سلسلته بنفسه قبل النهاية",
    legacyStatusFor("transfer", CLUB_PROCESSING), null);
check("ولا يكتب المسار فيه إلا نهايته",
    [legacyStatusFor("transfer", APPROVED), legacyStatusFor("transfer", REJECTED_FINAL)],
    ["accepted", "rejected"]);
check("والاعتماد النهائي accepted في الثلاثة",
    ["player", "player_release", "transfer"].map((e) => legacyStatusFor(e, APPROVED)),
    ["accepted", "accepted", "accepted"]);
check("وسجلّ مجهول لا يُكتب فيه شيء", legacyStatusFor("stadium", APPROVED), null);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
