// تعليقات الرسائل — ما تحمله، ولمن يُقال إنها وصلت (اجتماع العميل، 2026-11-16).
//
// النادي يردّ على رسالة الفريق بتعليق — «تم الاعتماد»، «الرجاء المراجعة» — ويريد أن
// يرفق به مستنداً: «أريد أرفق مستندات في التعليق». والفريق لم يكن يعرف أن على رسالته
// تعليقاً حتى يفتح قائمة الخيارات: «فيه طريقة سهلة… عشان يعرفون أن هنا فيه تعليق».
// فالتعليق الآن يحمل مستنداته، ويصل إشعارُه إلى الطرف الآخر من الرسالة.
//
// قرارات محضة: لا قاعدة بيانات.

/** ما يُرفق بالتعليق — كمرفقات الرسائل نفسها. */
export const ATTACHMENT_TYPES = ["JPEG", "JPG", "PNG", "PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "CSV", "ZIP", "MP4"];

export const extensionOf = (filename) => {
    const parts = String(filename || "").split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
};

/** لماذا لا يُقبل هذا الملف — أو null. */
export const attachmentProblem = (filename) => {
    const ext = extensionOf(filename);
    if (!ATTACHMENT_TYPES.includes(ext)) {
        return `الملف «${filename || "بلا اسم"}» من نوع لا يُقبل — المقبول: صور، PDF، Word، Excel، PowerPoint، ZIP`;
    }
    return null;
};

/** لماذا لا يُقبل التعليق — أو null. */
export const commentProblem = ({ content } = {}) => {
    const text = String(content ?? "").trim();
    if (!text) return "اختر التعليق";
    if (text.length > 255) return "التعليق أطول من 255 حرفاً — ضع التفصيل في الملاحظة";
    return null;
};

/**
 * إلى من يذهب إشعار التعليق: الطرف الآخر من الرسالة.
 *
 * علّق النادي → يُخبَر فريق الرسالة (مُرسِلها أو مستقبِلها). علّق الفريق → يُخبَر
 * نادي الرسالة. ورسالةٌ بين فريقين يُخبَر فيها الفريق الآخر.
 *
 * @returns {{ id_team?: string, id_club?: string } | null}
 */
export const commentRecipient = (message, { byClub = null, byTeam = null } = {}) => {
    if (!message) return null;
    if (byClub) {
        const team = message.id_team_sender || message.id_team_receiver;
        return team ? { id_team: team } : null;
    }
    if (byTeam) {
        const otherTeam = [message.id_team_sender, message.id_team_receiver].find((t) => t && t !== byTeam);
        if (otherTeam) return { id_team: otherTeam };
        const club = message.id_club_sender || message.id_club_receiver;
        return club ? { id_club: club } : null;
    }
    return null;
};

/** نصّ الإشعار — يقول إن في التعليق مستنداً، فلا يُقال «ما في مرفق». */
export const commentNotice = ({ subject, content, files = 0 }) =>
    `تعليق جديد على رسالة «${String(subject || "").slice(0, 80)}»: ${content}` +
    (files > 0 ? ` — مع ${files === 1 ? "مستند مرفق" : `${files} مستندات مرفقة`}` : "");
