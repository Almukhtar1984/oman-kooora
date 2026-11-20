// تفاصيل التصنيف: لا يكفي «لاعب» أو «جهاز فني» أو «مجلس إدارة».
//
// «إذا اخترنا اللاعب… إيش المركز اللي يلعب فيه، الفئة العمرية. إذا اخترنا
// مجلس إدارة… هل هو نائب الرئيس، أمين صندوق. إذا اخترنا الجهاز الفني… هل هو
// مدرب، مساعد مدرب» (العميل، 2026-11-19).
//
// كان التصنيف بلا تفاصيل يكتب "member" و"technical" بالإنجليزية في خانة
// الصفة، فظهرت «member / 38 سنة» على بطاقة مجلس الإدارة. الآن يُختار كلٌّ منها.
//
// قرارات محضة: لا قاعدة ولا IO.

/** الفئات العمرية كما في عمود players.class (ENUM). */
export const PLAYER_CLASSES = ["firstDegree", "secondDegree", "young", "rookies"];

const MAX_TEXT = 50; // players.player_center و classification كلاهما STRING(50)

const text = (value) => String(value ?? "").trim();

/**
 * ما ينقص لتصنيف الشخص إلى toType — أو null إن اكتمل.
 *
 * @param {string} toType   player | technical | member
 * @param {object} content  { class, player_center, classification }
 */
export const classificationDetailsProblem = (toType, content = {}) => {
    if (toType === "player") {
        const missing = [];
        if (!PLAYER_CLASSES.includes(text(content.class))) missing.push("الفئة العمرية");
        if (!text(content.player_center)) missing.push("مركز اللاعب");
        if (missing.length) return `اختر ${missing.join(" و")}`;
        if (text(content.player_center).length > MAX_TEXT) return "مركز اللاعب أطول من المسموح";
        return null;
    }
    if (toType === "technical" || toType === "member") {
        const value = text(content.classification);
        if (!value) return toType === "technical" ? "اختر الصفة في الجهاز الفني" : "اختر المنصب في مجلس الإدارة";
        if (value.length > MAX_TEXT) return "الصفة أطول من المسموح";
        return null;
    }
    return null;
};

/** القيم المنظّفة التي تُكتب — بعد أن يمرّ classificationDetailsProblem. */
export const classificationDetails = (toType, content = {}) => {
    if (toType === "player") return { class: text(content.class), player_center: text(content.player_center) };
    if (toType === "technical" || toType === "member") return { classification: text(content.classification) };
    return {};
};
