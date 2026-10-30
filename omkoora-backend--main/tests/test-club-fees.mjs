// رسوم الطلبات ومدفوعاتها — قواعد المالك: النادي يسعّر، والدفع كامل،
// والإيصال صورة مع رقمه المرجعي.

import {
    FEE_TYPES, feeLabel, isFeeType, normalizeAmount,
    canSubmitReceipt, canSubmitBatchReceipt, paymentDecision,
    PAYMENT_WAITING, PAYMENT_SUBMITTED, PAYMENT_ACCEPTED, PAYMENT_REJECTED, PAYMENT_STATUSES,
} from "../src/Helpers/clubFees.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

// الأربعة الأولى من رسالته الأولى، والاستقالة لحقت بها حين عدّها نوعَ طلب رابعاً.
check("أنواع الرسوم الخمسة", FEE_TYPES.map((f) => f.type),
    ["player_registration", "transfer", "loan", "team_registration", "player_release"]);
check("ولكل نوع اسم عربي", feeLabel("transfer"), "انتقال لاعب");
check("نوع مجهول يُرفض", isFeeType("donation"), false);

// المبالغ
check("المبلغ يُقرّب لمنزلتين", normalizeAmount("20.456"), 20.46);
check("الصفر مبلغ صحيح", normalizeAmount(0), 0);
check("السالب مرفوض", normalizeAmount(-5), null);
check("والنص غير الرقمي مرفوض", normalizeAmount("عشرون"), null);

// رفع الإيصال — الدفع كامل، والرقم المرجعي لازم.
const due = { status: PAYMENT_WAITING, amount: 50 };
check("إيصال كامل مع رقم مرجعي يمر",
    canSubmitReceipt(due, { reference_number: "TRX-9", amount: 50 }).ok, true);
check("ودفع أكثر من المطلوب يمر", canSubmitReceipt(due, { reference_number: "TRX-9", amount: 60 }).ok, true);
check("الدفع الجزئي مرفوض",
    canSubmitReceipt(due, { reference_number: "TRX-9", amount: 30 }).code, "PARTIAL_PAYMENT");
check("ورسالته تذكر المطلوب",
    canSubmitReceipt(due, { reference_number: "TRX-9", amount: 30 }).message.includes("50"), true);
check("بلا رقم مرجعي مرفوض",
    canSubmitReceipt(due, { reference_number: "  ", amount: 50 }).code, "REFERENCE_REQUIRED");
check("دفعة معتمدة لا تُرفع مرة أخرى",
    canSubmitReceipt({ status: PAYMENT_ACCEPTED, amount: 50 }, { reference_number: "X", amount: 50 }).code,
    "PAYMENT_ALREADY_ACCEPTED");
check("دفعة غير موجودة", canSubmitReceipt(null, { reference_number: "X" }).code, "PAYMENT_NOT_FOUND");

// قرار النادي
check("الاعتماد يُنهي الدفع",
    paymentDecision(PAYMENT_SUBMITTED, PAYMENT_ACCEPTED), { status: "accepted", settles: true, valid: true });
check("الرفض يعيدها لانتظار الدفع لا إلى طريق مسدود",
    paymentDecision(PAYMENT_SUBMITTED, PAYMENT_REJECTED),
    { status: "waiting", settles: false, valid: true, rejected: true });
check("دفعة معتمدة لا يُعاد البتّ فيها",
    paymentDecision(PAYMENT_ACCEPTED, PAYMENT_REJECTED), { status: "accepted", settles: false, valid: false });
check("قرار غير مفهوم لا يغيّر شيئاً",
    paymentDecision(PAYMENT_SUBMITTED, "maybe"), { status: "submitted", settles: false, valid: false });

check("الحالات الأربع معلنة", PAYMENT_STATUSES, ["waiting", "submitted", "accepted", "rejected"]);

// ——— إيصال واحد لعدّة مطالبات (موسم المسابقات) ———
// «يرسل مية ريال مرة واحدة… النادي ما يعرف هذا مال مين».
const loanA = { id: "a", id_team: "t1", status: PAYMENT_WAITING, amount: 20 };
const loanB = { id: "b", id_team: "t1", status: PAYMENT_WAITING, amount: 30 };
const loanC = { id: "c", id_team: "t1", status: PAYMENT_WAITING, amount: 20 };
const move  = { id: "d", id_team: "t1", status: PAYMENT_WAITING, amount: 30 };
check("مئة ريال تسدّد ثلاث إعارات وانتقالاً",
    canSubmitBatchReceipt([loanA, loanB, loanC, move], { reference_number: "TR-100", amount: 100 }),
    { ok: true, total: 100 });
check("وبلا مبلغ يُفترض المجموع",
    canSubmitBatchReceipt([loanA, loanB], { reference_number: "TR-50" }).total, 50);
check("والأقل من المجموع مرفوض بالمجموع نفسه",
    canSubmitBatchReceipt([loanA, loanB, loanC, move], { reference_number: "TR", amount: 90 }).message,
    "المبلغ المحوَّل أقل من مجموع المطالبات (100) — الدفع يكون كاملاً");
check("والرقم المرجعي لازم",
    canSubmitBatchReceipt([loanA], { reference_number: " " }).code, "REFERENCE_REQUIRED");
check("ولا شيء يُسدَّد بلا اختيار", canSubmitBatchReceipt([], { reference_number: "x" }).code, "PAYMENTS_REQUIRED");
check("ولا مطالبة سُدّدت قبلُ",
    canSubmitBatchReceipt([loanA, { ...loanB, status: PAYMENT_ACCEPTED }], { reference_number: "x" }).code,
    "PAYMENT_NOT_OPEN");
check("ولا يجمع إيصالٌ فريقين",
    canSubmitBatchReceipt([loanA, { ...loanB, id_team: "t2" }], { reference_number: "x" }).code, "PAYMENTS_MIXED");
check("والمرفوض إيصالُه سابقاً عاد قائماً فيُسدَّد",
    canSubmitBatchReceipt([{ ...loanA, status: PAYMENT_WAITING }], { reference_number: "x", amount: 20 }).ok, true);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
