// الطريق الذي يسلكه الطلب — وما بقي منه.
//
// المالك أراد الطلب يُتتبّع كما تُتتبّع الشحنة: لا شارةً تقول حالته الآن وتمحو
// ما قبلها، بل خطاً يُقرأ — ما مرّ، وأين يقف، وما بقي. الأحداث تقول ما مرّ،
// وهذا الملف يقول ما بقي، ومن عليه الدور.
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
// حيث وقعا لا في قائمة ما ينتظر. والسداد منه دائماً: «جميع الأندية تعتمد على
// هذا الشيء» — يُسدَّد أو يُعفى منه بقرار، ولا يُتخطّى.
export const ROAD = [SUBMITTED, CLUB_PROCESSING, AWAITING_PAYMENT, PAID_REVIEW, APPROVED];

// إجراءات تُقرَّر في لوحة الرسوم وسلسلة الناديين، لا بين أزرار الخط العامة.
export const SIDE_PANEL_KINDS = ["bill", "waive", "return_receipt", "transfer_accept", "transfer_reject"];

export interface Flow {
    stage?: string | null;
    done?: boolean | null;
    actor?: string | null;
    side?: string | null;
    fee_waived?: boolean | null;
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

const ACTOR = { team: "الفريق", club: "النادي" } as Record<string, string>;

/**
 * من عليه الدور، بلسان من يقرأ: «الدور عليك» أو «الدور على النادي».
 *
 * والنادي الذي يأتي دوره في سلسلة الناديين يُقال له ذلك صراحةً — المسار نفسه
 * عند النادي المستقبِل، والقرار الآن عند ناديه.
 */
export const turnText = (flow?: Flow | null): string | null => {
    if (!flow || flow.done) return null;
    if (flow.side === "chain") return "الدور على ناديك: موافقة أو رفض في سلسلة الناديين";
    if (flow.side === "observer") return "تتابع هذا الطلب — والقرار فيه لغيرك";
    if (flow.actor && flow.actor === flow.side) return "الدور عليك";
    return `الدور على ${ACTOR[flow.actor || ""] || "الطرف الآخر"}`;
};
