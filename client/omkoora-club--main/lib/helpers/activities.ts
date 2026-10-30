// أنشطة الفريق — قائمة تُختار، لا نصّ يُكتب.
//
// نسخة الواجهة من omkoora-backend--main/src/Helpers/activities.mjs: كان النشاط
// نصّاً حرّاً فكتب نادٍ «كره القدم» وآخر «FOOTBAL»، فقسم الإحصاء الرياضة
// الواحدة. الخادم يوحّد ما يُخزَّن، وهذه تقرأ القيمة المخزّنة قبل التوحيد كي
// تظهر في القائمة مختارةً لا ضائعة.

export const ACTIVITIES = ["كرة القدم", "كرة السلة", "كرة اليد", "كرة الطائرة"];

const KEYWORDS: { activity: string; words: string[] }[] = [
    { activity: "كرة القدم", words: ["قدم", "football", "footbal", "soccer", "foot"] },
    { activity: "كرة السلة", words: ["سله", "basket"] },
    { activity: "كرة اليد", words: ["يد", "handball", "hand"] },
    { activity: "كرة الطائرة", words: ["طائره", "طايره", "طاىره", "volley"] },
];

const fold = (text: string) => text
    .toLowerCase()
    .replace(/ـ/g, "")
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();

/** الاسم الواحد للنشاط، أو النصّ نفسه إن لم يُعرف — فلا يختفي ما كُتب. */
export const canonicalActivity = (raw?: string | null): string | null => {
    const folded = fold(String(raw ?? ""));
    if (!folded) return null;
    const tokens = folded.split(/[\s\-_]+/).map((token) => token.replace(/^ال/, ""));
    const hit = KEYWORDS.find(({ words }) =>
        words.some((word) => tokens.includes(word) || (word.length > 3 && folded.includes(word))));
    return hit ? hit.activity : String(raw).replace(/\s+/g, " ").trim();
};

const SEPARATORS = /[،,؛;/|+]+|\s+و(?=\s*كر)/;

/** أنشطة الفريق من النصّ المخزّن: مفصولة، موحّدة، بلا تكرار. */
export const splitActivities = (raw?: string | null): string[] => {
    const list = String(raw ?? "")
        .split(SEPARATORS)
        .map(canonicalActivity)
        .filter((activity): activity is string => Boolean(activity));
    return Array.from(new Set(list));
};

/** كيف تُرسل القائمة إلى الخادم: مفصولة بفاصلة عربية كما يخزّنها. */
export const joinActivities = (list: string[]) => splitActivities(list.join("،")).join("، ");
