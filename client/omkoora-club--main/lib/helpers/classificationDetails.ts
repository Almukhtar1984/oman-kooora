// تفاصيل التصنيف (العميل، 2026-11-19): اللاعب ← مركزه وفئته العمرية، والجهاز
// الفني ← صفته، ومجلس الإدارة ← منصبه. الملف نفسه في تطبيقي النادي والفريق،
// والخادم يتحقق من الشيء نفسه (src/Helpers/classificationDetails.mjs).
import { TECHNICAL_CLASSIFICATIONS } from "../../constants/technicalClassifications";

export type ClassificationType = "player" | "technical" | "member";

export type ClassificationDetails = {
    class?: string | null;
    player_center?: string | null;
    classification?: string | null;
};

/** الفئات العمرية — قيم عمود players.class كما في «إضافة لاعب». */
export const PLAYER_CLASSES = [
    { value: "firstDegree", label: "الفريق الأول" },
    { value: "secondDegree", label: "تحت 23 سنة" },
    { value: "young", label: "تحت 18 سنة" },
    { value: "rookies", label: "تحت 16 سنة" },
];

export const PLAYER_CENTERS = ["حارس", "دفاع", "وسط", "مهاجم"];

export const BOARD_POSITIONS = ["رئيس", "نائب رئيس", "أمين السر", "أمين الصندوق", "عضو"];

export { TECHNICAL_CLASSIFICATIONS };

const filled = (value?: string | null) => Boolean(String(value ?? "").trim());

/** ما ينقص لإتمام التصنيف — فارغةٌ إن اكتمل. */
export const detailsMissing = (toType: string | null, details: ClassificationDetails): string[] => {
    if (toType === "player") {
        return [
            ...(PLAYER_CLASSES.some((c) => c.value === details.class) ? [] : ["الفئة العمرية"]),
            ...(filled(details.player_center) ? [] : ["مركز اللاعب"]),
        ];
    }
    if (toType === "technical") return filled(details.classification) ? [] : ["الصفة"];
    if (toType === "member") return filled(details.classification) ? [] : ["المنصب"];
    return [];
};

/** ما يُرسل مع التصنيف: تفاصيل النوع المختار وحده. */
export const detailsFor = (toType: string | null, details: ClassificationDetails) => {
    if (toType === "player") return { class: details.class, player_center: details.player_center };
    if (toType === "technical" || toType === "member") return { classification: details.classification };
    return {};
};

// قيمٌ كتبها التصنيف القديم بلا اختيار، أو حساب مدير الفريق — تُعرض بالعربية.
const ROLE_LABELS: Record<string, string> = {
    member: "عضو",
    technical: "جهاز فني",
    manager: "مدير الفريق",
};

/** الصفة أو المنصب كما يُعرض على البطاقة. */
export const roleLabel = (value?: string | null) => {
    const raw = String(value ?? "").trim();
    return ROLE_LABELS[raw.toLowerCase()] || raw;
};
