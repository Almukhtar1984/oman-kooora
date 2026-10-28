// الطريق الذي يسلكه الطلب — وما بقي منه.
//
// المالك أراد الطلب يُتتبّع كما تُتتبّع الشحنة: لا شارةً تقول حالته الآن وتمحو
// ما قبلها، بل خطاً يُقرأ — ما مرّ، وأين يقف، وما بقي. الأحداث تقول ما مرّ،
// وهذا الملف يقول ما بقي.
//
// قرارات محضة: لا استعلام ولا واجهة.

export const DRAFT = "draft";
export const SUBMITTED = "submitted";
export const REJECTED_INITIAL = "rejected_initial";
export const CLUB_PROCESSING = "club_processing";
export const AWAITING_PAYMENT = "awaiting_payment";
export const PAID_REVIEW = "paid_review";
export const APPROVED = "approved";

// الطريق بترتيبه. والرفض والإلغاء ليسا منه: هما خروج عنه، ويظهران في الخط
// حيث وقعا لا في قائمة ما ينتظر.
export const ROAD = [SUBMITTED, CLUB_PROCESSING, AWAITING_PAYMENT, PAID_REVIEW, APPROVED];

// مرحلتا المال. ونادٍ لم يسعّر هذا النوع لا يمرّ طلبه بهما أصلاً، فتُعرضان
// معلّقتين على شرطهما حتى تصدر المطالبة.
const MONEY = [AWAITING_PAYMENT, PAID_REVIEW];

export interface Flow {
    stage?: string | null;
    done?: boolean | null;
    payment?: { id?: string } | null;
}

/**
 * ما بقي من الطريق بعد المرحلة التي يقف عندها الطلب.
 *
 * فارغ إن انتهى الطلب — اعتُمد أو رُفض نهائياً أو أُلغي — فلا يُوعد الفريق
 * بخطوات لن تأتي. والمرفوض مبدئياً يعود إلى أول الطريق: التعديل وإعادة
 * الإرسال، وهو ما قاله المالك نصّاً.
 */
export const remainingRoad = (flow?: Flow | null): string[] => {
    if (!flow || flow.done) return [];

    const stage = flow.stage || "";
    if (stage === DRAFT || stage === REJECTED_INITIAL) return [...ROAD];

    const at = ROAD.indexOf(stage);
    if (at < 0) return [];
    return ROAD.slice(at + 1);
};

/** مرحلة مشروطة برسوم لم يطالب بها أحد بعد؟ */
export const isConditional = (flow: Flow | null | undefined, stage: string): boolean =>
    !flow?.payment && MONEY.includes(stage);
