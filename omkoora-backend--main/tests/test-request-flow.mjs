// مسار الطلب — المراحل التسع التي تسلكها طلبات الفريق الأربعة،
// كما وصفها المالك: تقديم، مراجعة مبدئية، سداد رسوم، اعتماد نهائي.

import {
    STAGES, REQUEST_TYPES, stageLabel, stageInfo, isStage, isDone,
    requestTypeLabel, isRequestType, allowsResubmit,
    canAdvance, legacyStatus, legacyStatusFor,
    availableActions, suggestedFee, openingStage, stageLabelFor, outcomeOf, legacyDecisionMove,
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
check("ثم يطالب بالرسوم بمبلغها",
    canAdvance(at(CLUB_PROCESSING), { to: AWAITING_PAYMENT, by: "club", amount: 15 }).ok, true);
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

// ——— السداد مرحلة لا يتخطّاها طلب (اجتماع 2026-10-30) ———
// «جميع الأندية تعتمد على هذا الشيء… إلا في الدفع الرسوم» — وكانت استقالةٌ قد
// مرّت من «مقبول مبدئياً» إلى «معتمد نهائياً» لأن النادي لم يسعّرها.
check("لا اعتماد من «مقبول مبدئياً» مباشرة",
    canAdvance(at(CLUB_PROCESSING), { to: APPROVED, by: "club" }).code, "STAGE_TRANSITION_INVALID");
check("والمطالبة بلا مبلغ تُردّ بسببها",
    canAdvance(at(CLUB_PROCESSING), { to: AWAITING_PAYMENT, by: "club" }).code, "AMOUNT_REQUIRED");
check("وبمبلغ صفر كذلك — الإعفاء قرارٌ له زرّه",
    canAdvance(at(CLUB_PROCESSING), { to: AWAITING_PAYMENT, by: "club", amount: 0 }).code, "AMOUNT_REQUIRED");
check("ورسالتها تدلّ على البديل",
    canAdvance(at(CLUB_PROCESSING), { to: AWAITING_PAYMENT, by: "club" }).message,
    "حدّد مبلغ الرسوم، أو اعفِ الطلب منها صراحةً");

// ——— الإعفاء: «إعارة مجانية» قرارٌ مكتوب ———
check("النادي يُعفي الطلب بسبب",
    canAdvance(at(CLUB_PROCESSING), { to: PAID_REVIEW, by: "club", reason: "إعارة مجانية" }).ok, true);
check("ولا إعفاء بلا سبب",
    canAdvance(at(CLUB_PROCESSING), { to: PAID_REVIEW, by: "club" }).code, "WAIVER_REASON_REQUIRED");
check("ولا يُعفي الفريقُ نفسه",
    canAdvance(at(CLUB_PROCESSING), { to: PAID_REVIEW, by: "team", reason: "x" }).code, "FLOW_FORBIDDEN");
check("والمُعفى لا إيصال فيه يُردّ",
    canAdvance({ stage: PAID_REVIEW, fee_waived: true }, { to: AWAITING_PAYMENT, by: "club" }).code, "FEE_WAIVED");
check("وخطّه يقول «أُعفي» لا «تم السداد»",
    stageLabelFor(PAID_REVIEW, { fee_waived: true }), "أُعفي من الرسوم — بانتظار الاعتماد النهائي");
check("وغير المُعفى يبقى بمسمّاه", stageLabelFor(PAID_REVIEW, {}), stageLabel(PAID_REVIEW));

// ——— سعر النادي اقتراحٌ يملأ الحقل، لا قرار ———
check("سعر مفعّل يُقترح", suggestedFee({ type: "transfer", fee: { active: true, amount: 20 } }), 20);
check("وسعر موقوف لا يُقترح", suggestedFee({ type: "transfer", fee: { active: false, amount: 20 } }), null);
check("ولا سعر صفر", suggestedFee({ type: "transfer", fee: { active: true, amount: 0 } }), null);
check("ولا نادٍ لم يسعّر", suggestedFee({ type: "transfer", fee: null }), null);
check("والكسور بمنزلتين", suggestedFee({ type: "loan", fee: { active: true, amount: "12.345" } }), 12.35);

// ——— أزرار كل طرف ———
const labels = (list) => list.map((a) => a.label);
check("أمام النادي بعد القبول المبدئي: مطالبة، إعفاء، رفض، إلغاء",
    labels(availableActions({ stage: CLUB_PROCESSING, request_type: "loan" }, "club")),
    ["مطالبة بالرسوم", "إعفاء من الرسوم", "رفض نهائي (مع السبب)", "إلغاء الطلب"]);
check("والمطالبة تطلب مبلغاً والإعفاء سبباً",
    availableActions({ stage: CLUB_PROCESSING, request_type: "loan" }, "club")
        .slice(0, 2).map((a) => [a.kind, a.needsAmount, a.needsReason]),
    [["bill", true, false], ["waive", false, true]]);
check("ولا زرّ سداد للفريق — الإيصال يحرّكه",
    labels(availableActions({ stage: AWAITING_PAYMENT, request_type: "loan" }, "team")), ["إلغاء الطلب"]);
check("وبعد السداد: اعتماد، ردّ الإيصال، رفض",
    labels(availableActions({ stage: PAID_REVIEW, request_type: "loan" }, "club")),
    ["اعتماد نهائي", "ردّ الإيصال للسداد", "رفض نهائي (مع السبب)", "إلغاء الطلب"]);
check("وبعد الإعفاء لا «ردّ الإيصال»",
    labels(availableActions({ stage: PAID_REVIEW, request_type: "loan", fee_waived: true }, "club")),
    ["اعتماد نهائي", "رفض نهائي (مع السبب)", "إلغاء الطلب"]);
check("وفي المراجعة المبدئية رفضان: يُعدَّل أو يُغلق",
    labels(availableActions({ stage: SUBMITTED, request_type: "player_registration" }, "club")),
    ["قبول مبدئي", "رفض مبدئي (مع السبب)", "رفض نهائي (مع السبب)", "إلغاء الطلب"]);
check("ولا أزرار في طلب منتهٍ", availableActions({ stage: APPROVED }, "club"), []);
check("ولا للمراقب", availableActions({ stage: SUBMITTED }, "observer"), []);

// ——— طلبٌ أنشأه النادي بنفسه ———
// «سوّينا إعارة… مفروض يمرّ على مسار الطلبات، أين راح؟» — كانت تولد معتمدة.
check("يبدأ مقبولاً مبدئياً", openingStage({ byClub: true }), CLUB_PROCESSING);
check("وطلب الفريق يبدأ مقدّماً", openingStage({ byClub: false }), SUBMITTED);

// ——— الأثر عند نهاية الطريق وحدها ———
check("الانتقال يُنفَّذ عند الاعتماد النهائي", outcomeOf("transfer", APPROVED), "finalize");
check("لا عند القبول المبدئي", outcomeOf("transfer", CLUB_PROCESSING), null);
check("ولا عند السداد", outcomeOf("transfer", PAID_REVIEW), null);
check("ورفضه أو إلغاؤه يُبقي اللاعب",
    [outcomeOf("transfer", REJECTED_FINAL), outcomeOf("transfer", CANCELLED)], ["abandon", "abandon"]);
check("والاستقالة تُخلي طرفه عند الاعتماد", outcomeOf("player_release", APPROVED), "release");
check("ورفضها يُبقيه", outcomeOf("player_release", REJECTED_FINAL), "refuse");
check("والتسجيل تكفيه المرآة", outcomeOf("player", APPROVED), null);

// ——— زرّا الصفحات القديمة على الطريق نفسه ———
check("«قبول» في البطاقة قبولٌ مبدئي", legacyDecisionMove(SUBMITTED, "accepted"), { to: CLUB_PROCESSING });
check("وبعد السداد اعتمادٌ نهائي", legacyDecisionMove(PAID_REVIEW, "accepted"), { to: APPROVED });
check("وقبل قرار الرسوم يُقال لماذا لا",
    legacyDecisionMove(CLUB_PROCESSING, "accepted").code, "FEE_DECISION_PENDING");
check("وأثناء انتظار السداد كذلك", legacyDecisionMove(AWAITING_PAYMENT, "accepted").code, "AWAITING_PAYMENT");
check("و«رفض» في المراجعة المبدئية يعيده للفريق", legacyDecisionMove(SUBMITTED, "rejected"), { to: REJECTED_INITIAL });
check("وبعدها رفضٌ نهائي", legacyDecisionMove(PAID_REVIEW, "rejected"), { to: REJECTED_FINAL });
check("والمنتهي لا يُقبل", legacyDecisionMove(APPROVED, "accepted").code, "FLOW_CLOSED");

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
check("والانتقال يدير سلسلته بنفسه قبل اتفاق الناديين",
    legacyStatusFor("transfer", SUBMITTED), null);
check("وبعد اتفاقهما ينتظر رسومه واعتماده — لا «مقبول» واللاعب لم ينتقل",
    [CLUB_PROCESSING, AWAITING_PAYMENT, PAID_REVIEW].map((st) => legacyStatusFor("transfer", st)),
    ["waiting_payment", "waiting_payment", "waiting_payment"]);
check("ونهايته مقبول أو مرفوض",
    [legacyStatusFor("transfer", APPROVED), legacyStatusFor("transfer", REJECTED_FINAL)],
    ["accepted", "rejected"]);
check("والاعتماد النهائي accepted في الثلاثة",
    ["player", "player_release", "transfer"].map((e) => legacyStatusFor(e, APPROVED)),
    ["accepted", "accepted", "accepted"]);
check("وسجلّ مجهول لا يُكتب فيه شيء", legacyStatusFor("stadium", APPROVED), null);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
