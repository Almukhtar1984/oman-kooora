// Pure helper for the AI news editor (draft / reformulate / improve). Turns the
// owner's raw input into a provider prompt. JSON parsing is shared with the
// match-news path (parseNewsJSON in matchNews.mjs). No DB / network here.

export const NEWS_MODES = ["draft", "reformulate", "improve"];

const CATEGORY_LABEL = {
    news: "أخبار",
    competitions: "مسابقات",
    players: "لاعبين",
    clubs: "أندية",
};

// Per-mode instruction. All modes forbid inventing facts beyond the input.
const MODE_INSTRUCTION = {
    draft: "اكتب خبرًا صحفيًا متكاملًا انطلاقًا من الفكرة أو العناصر التالية. وسّعها إلى خبر مترابط دون أن تختلق وقائع (أسماء، أرقام، تصريحات) غير مذكورة.",
    reformulate: "أعد صياغة النص التالي بأسلوب صحفي احترافي مع الحفاظ على جميع الوقائع كما هي، دون إضافة معلومة جديدة ولا حذف معلومة جوهرية.",
    improve: "حسّن النص التالي لغويًا وأسلوبيًا (نحو، ترابط، وضوح) مع إبقاء المعنى والوقائع والطول العام كما هي قدر الإمكان.",
};

export const normalizeMode = (mode) => (NEWS_MODES.includes(mode) ? mode : "draft");

// Build the {system, prompt} pair for the editor. Pure + deterministic.
export const buildNewsDraftPrompt = ({ text, mode, category } = {}) => {
    const body = String(text || "").trim();
    if (!body) throw new Error("النص مطلوب");
    const m = normalizeMode(mode);
    const catLabel = CATEGORY_LABEL[category] || "";

    const system =
        "أنت محرّر صحفي رياضي محترف في موقع كرة قدم عُماني. اكتب بالعربية الفصحى المبسّطة " +
        "بنبرة محايدة واحترافية. اعتمد فقط على ما ورد في نص المستخدم ولا تختلق أي وقائع " +
        "غير مذكورة فيه. أعد ردك بصيغة JSON فقط دون أي نص إضافي.";

    const prompt =
        MODE_INSTRUCTION[m] + "\n\n" +
        (catLabel ? `تصنيف الخبر: ${catLabel}\n\n` : "") +
        "النص:\n" + body + "\n\n" +
        "أعد النتيجة حصراً بهذا الشكل JSON:\n" +
        '{\n' +
        '  "subject": "عنوان جذّاب قصير (لا يتجاوز 100 حرف)",\n' +
        '  "short_description": "ملخّص في جملة واحدة (لا يتجاوز 160 حرفًا)",\n' +
        '  "description": "نص الخبر كاملًا (لا يتجاوز 900 حرف)"\n' +
        "}";

    return { system, prompt };
};
