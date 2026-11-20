// «تسجيل عضو جديد» — بابٌ واحد بدل ثلاثة (العميل، 2026-11-08).
//
// كان الفريق يختار قبل أن يسجّل: لاعب؟ جهاز فني؟ مجلس إدارة؟ «في فرق ما عارفة…
// تقول هنا أروح اللاعب ولا الجهاز الفني ولا مجلس الإدارة». الآن يسجّل العضو
// فيدخل العضوية مباشرة، والنادي يعتمد العضوية — «النادي ما يهمه لاعب أو جهاز
// فني، أهم حاجة تسجيل عضو» — ثم يختار الفريق تصنيفه من بطاقته.
//
// قرارات محضة: لا قاعدة بيانات.

import { ageOn } from "./requestFile.mjs";

const toAsciiDigits = (text) => String(text ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

/** الرقم المدني كما يُخزَّن: أرقام لاتينية بلا فراغات. */
export const normalizeCardNumber = (value) => toAsciiDigits(value).replace(/\s+/g, "").trim();

const REQUIRED = [
    ["first_name", "الاسم الأول"],
    ["second_name", "الاسم الثاني"],
    ["tribe", "القبيلة"],
    ["card_number", "الرقم المدني"],
    ["phone", "رقم الهاتف"],
    ["date_birth", "تاريخ الميلاد"],
];

/** ما ينقص طلب التسجيل، أو null حين يكتمل. */
export const registrationProblem = (content = {}) => {
    const missing = REQUIRED.filter(([key]) => !String(content?.[key] ?? "").trim()).map(([, label]) => label);
    if (missing.length) return `أكمل: ${missing.join("، ")}`;
    const card = normalizeCardNumber(content.card_number);
    if (!/^\d{6,12}$/.test(card)) return "الرقم المدني أرقامٌ من 6 إلى 12 خانة";
    const phone = normalizeCardNumber(content.phone);
    if (!/^\+?\d{8,15}$/.test(phone)) return "رقم الهاتف غير صالح";
    return null;
};

// مستندات الطلب (العميل، 2026-11-19): «استمارة طلب العضوية، وإذا كان أقل من 18
// تعهد ولي الأمر — هذا بالنسبة لتسجيل العضوية». فبغير الاستمارة لا يصل الطلب إلى
// النادي ناقصاً ثم يُرفض، والقاصر لا يُسجَّل بلا تعهد وليّه.

/** سنّ من يحتاج تعهد ولي الأمر: من هو دونها. */
export const GUARDIAN_AGE = 18;

/** وما يرفعه الفريق فوق ذلك — طلب الرفع يحمل عشرة ملفات، خمسة منها للصور والاستمارتين. */
export const MAX_EXTRA_ATTACHMENTS = 5;

/** هل يحتاج هذا العضو تعهد ولي الأمر؟ تاريخٌ لا يُقرأ لا يُلزم بشيء. */
export const needsGuardian = (birth, today = new Date()) => {
    const age = ageOn(birth, today);
    return age !== null && age < GUARDIAN_AGE;
};

/**
 * ما ينقص مستندات التسجيل، أو null حين تكتمل.
 * يكفي أن يكون الملف موجوداً: نوعه يُفحص حين يُحفظ.
 */
export const documentsProblem = ({ date_birth, membership_form, guardian_form, attachments = [] } = {}, today = new Date()) => {
    const missing = [];
    if (!membership_form) missing.push("استمارة طلب العضوية");
    if (needsGuardian(date_birth, today) && !guardian_form) missing.push(`تعهد ولي الأمر (العضو دون ${GUARDIAN_AGE} سنة)`);
    if (missing.length) return `أرفق: ${missing.join("، ")}`;
    if ((attachments || []).length > MAX_EXTRA_ATTACHMENTS) {
        return `المرفقات الأخرى ${MAX_EXTRA_ATTACHMENTS} ملفات على الأكثر`;
    }
    return null;
};

// ما يُكتب في سجلّ العضوية عند «تعديل» — بلا الملفات المرفوعة.
//
// كانت نافذتا التعديل ترسلان الصورة التي لم تُرفع من جديد null، فيكتبها الخادم
// كما هي: يعدّل الفريق اسماً فتُمحى صورتا البطاقة. والملف يُستبدل بملفٍ يُرفع،
// ولا يُمحى بغيابه. والتاريخ الذي لا يُقرأ («Invalid Date» من حقلٍ فارغ) لا يُكتب.
const UPLOAD_KEYS = [
    "nationalID", "nationalIDBack", "personal_picture", "membership_form", "guardian_form", "attachments",
    "oldNationalID", "oldNationalIDBack", "oldPersonalPicture",
];
const DATE_KEYS = ["date_birth", "membership_date", "subscription_date"];

export const assemblyUpdateFields = (content = {}) => {
    const fields = { ...content };
    UPLOAD_KEYS.forEach((key) => { delete fields[key]; });
    DATE_KEYS.forEach((key) => {
        const value = fields[key];
        if (value !== undefined && value !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) delete fields[key];
    });
    return fields;
};

/** العضو المعتمد يُصنَّف؛ ومن ينتظر النادي أو رُفض لا يُصنَّف بعد. NULL = عضو قديم معتمد. */
export const isAdmitted = (assembly) => !assembly?.status || assembly.status === "accepted";

export const CLASSIFY_TARGETS = {
    player: "لاعب",
    technical: "جهاز فني",
    member: "مجلس إدارة",
};

/**
 * لماذا لا يُصنَّف هذا العضو إلى هذا التصنيف — أو null إن جاز.
 *
 * @param {object} assembly           سجلّ العضوية
 * @param {string} toType             player | technical | member
 * @param {object} existing           ما للشخص نفسه: { player: {teamName}|null, technical: bool, member: bool }
 */
export const classifyProblem = (assembly, toType, existing = {}) => {
    if (!assembly) return "العضو غير موجود";
    if (!CLASSIFY_TARGETS[toType]) return "تصنيف غير معروف";
    if (assembly.status === "waiting_club") return "العضوية بانتظار اعتماد النادي — يُختار التصنيف بعد الاعتماد";
    if (assembly.status === "rejected") return "رفض النادي هذه العضوية، فلا تصنيف لها";
    if (!assembly.id_team) return "العضو غير مسجّل في فريق";
    // لاعبٌ في فريقٍ آخر لا يُسجَّل ثانيةً — ذلك انتقال.
    if (toType === "player" && existing.player) {
        return existing.player.sameTeam
            ? "مسجّل لاعباً في هذا الفريق بالفعل"
            : `مسجّل لاعباً في ${existing.player.teamName || "فريق آخر"} — ضمّه بطلب انتقال`;
    }
    if (toType === "technical" && existing.technical) return "مسجّل في الجهاز الفني لهذا الفريق بالفعل";
    if (toType === "member" && existing.member) return "مسجّل في مجلس إدارة هذا الفريق بالفعل";
    return null;
};
