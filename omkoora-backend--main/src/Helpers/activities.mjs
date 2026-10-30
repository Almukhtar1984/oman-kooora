// أنشطة الفريق — قائمة تُختار، لا نصّ يُكتب.
//
// كان حقل «النشاط» في إضافة الفريق نصّاً حرّاً، فكتب نادٍ «كرة القدم» وآخر
// «كره القدم» وثالث «FOOTBAL»، فقسم الإحصاء الرياضةَ الواحدة ثلاثة أنشطة
// (طلب العميل، اجتماع 2026-10-30). الواجهة صارت قائمة، وهذا الملف يقرأ ما كُتب
// قبلها: يعيد كل صيغة إلى اسمها الواحد، ويفصل الفريق ذا النشاطين إلى نشاطين.
//
// قرارات محضة: لا قاعدة بيانات.

export const ACTIVITIES = ["كرة القدم", "كرة السلة", "كرة اليد", "كرة الطائرة"];

export const UNSPECIFIED = "غير محدد";

// كلمة مفتاحية تكفي لتعرّف الرياضة مهما اختلف رسمها.
const KEYWORDS = [
    { activity: "كرة القدم",   words: ["قدم", "football", "footbal", "soccer", "foot"] },
    { activity: "كرة السلة",   words: ["سله", "basket"] },
    { activity: "كرة اليد",    words: ["يد", "handball", "hand"] },
    { activity: "كرة الطائرة", words: ["طائره", "طايره", "طاىره", "volley"] },
];

// يوحّد الرسم: الهمزات، والتاء المربوطة، والتطويل، والحروف اللاتينية.
const fold = (text) => String(text ?? "")
    .toLowerCase()
    .replace(/ـ/g, "")             // تطويل
    .replace(/[ً-ْ]/g, "")    // تشكيل
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();

/**
 * الاسم الواحد للنشاط، أو النصّ نفسه مرتّباً إن لم يُعرف.
 *
 * «كره القدم» و«كرة قدم» و«FOOTBAL» كلها «كرة القدم». ونشاط لا نعرفه — رياضة
 * لم تدخل القائمة بعد — يبقى كما كُتب ولا يُرمى، كي لا يختفي فريق من الإحصاء.
 */
export const canonicalActivity = (raw) => {
    const folded = fold(raw);
    if (!folded) return null;
    // الكلمة كاملة لا جزءاً منها: «يد» في «كرة اليد» لا في «جديد».
    const tokens = folded.replace(/^ال/, "").split(/[\s\-_]+/).map((t) => t.replace(/^ال/, ""));
    for (const { activity, words } of KEYWORDS) {
        if (words.some((word) => tokens.includes(word) || (word.length > 3 && folded.includes(word)))) {
            return activity;
        }
    }
    return String(raw).replace(/\s+/g, " ").trim();
};

// الفواصل التي يكتبها الناس بين نشاطين.
const SEPARATORS = /[،,؛;/|+]+|\s+و(?=\s*كر)/;

/** أنشطة الفريق مفصولةً وموحّدةً وبلا تكرار — من النصّ المخزّن. */
export const teamActivities = (raw) => {
    const seen = new Set();
    String(raw ?? "")
        .split(SEPARATORS)
        .map(canonicalActivity)
        .filter(Boolean)
        .forEach((activity) => seen.add(activity));
    return [...seen];
};

/** كيف تُخزَّن القائمة في العمود النصّي: مفصولة بفاصلة عربية. */
export const formatActivities = (list) => teamActivities((list || []).join("،")).join("، ");

/**
 * عدّاد الأنشطة للإحصاء: الفريق ذو النشاطين يُعدّ في كليهما، والفريق بلا نشاط
 * يُعدّ «غير محدد» كما كان.
 */
export const countActivities = (teams, into = {}) => {
    teams.forEach((team) => {
        const list = teamActivities(team?.activities);
        (list.length ? list : [UNSPECIFIED]).forEach((activity) => {
            into[activity] = (into[activity] || 0) + 1;
        });
    });
    return into;
};
