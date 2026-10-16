// Pure helpers for AI-generated match-result news. Kept free of DB/network so
// they can be unit-tested: turn gathered match facts into a provider prompt,
// and parse the model's JSON back into a {subject, short_description, description}.

// Arabic label for a match stage (Match.type enum).
export const stageLabelAr = (type) => ({
    "groups": "دور المجموعات",
    "league-16": "دور الـ16",
    "league-8": "دور الـ8",
    "quarter-finals": "ربع النهائي",
    "semi-finals": "نصف النهائي",
    "final": "النهائي",
}[type] || "");

// Field length caps that match the Blog model columns.
export const NEWS_LIMITS = { subject: 255, short_description: 255, description: 1000 };

const clamp = (s, n) => {
    const t = String(s ?? "").trim();
    return t.length <= n ? t : t.slice(0, n - 1).trim() + "…";
};

// Describe the result in plain Arabic from the two scores + team names.
export const resultLineAr = (facts) => {
    const { teamA, teamB, goalsA, goalsB } = facts;
    const a = Number(goalsA || 0), b = Number(goalsB || 0);
    if (a === b) return `تعادل ${teamA} مع ${teamB} بنتيجة ${a}-${b}`;
    const [winner, loser, ws, ls] = a > b ? [teamA, teamB, a, b] : [teamB, teamA, b, a];
    return `فوز ${winner} على ${loser} بنتيجة ${ws}-${ls}`;
};

// Build the {system, prompt} pair. Pure and deterministic. The model is asked
// for STRICT JSON so the resolver can store it straight into a Blog.
export const buildMatchNewsPrompt = (facts) => {
    const lines = [];
    if (facts.league) lines.push(`البطولة: ${facts.league}`);
    if (facts.stage) lines.push(`الدور: ${facts.stage}`);
    lines.push(`الفريق الأول: ${facts.teamA} — سجّل ${Number(facts.goalsA || 0)}`);
    lines.push(`الفريق الثاني: ${facts.teamB} — سجّل ${Number(facts.goalsB || 0)}`);
    lines.push(`النتيجة النهائية: ${facts.teamA} ${Number(facts.goalsA || 0)} - ${Number(facts.goalsB || 0)} ${facts.teamB}`);
    lines.push(`الخلاصة: ${resultLineAr(facts)}`);
    if (facts.venue) lines.push(`الملعب: ${facts.venue}`);
    if (facts.date) lines.push(`التاريخ: ${facts.date}`);
    if (facts.manOfMatch) lines.push(`رجل المباراة: ${facts.manOfMatch}`);
    if (Array.isArray(facts.scorers) && facts.scorers.length) {
        const scs = facts.scorers
            .map((s) => `${s.player}${s.team ? ` (${s.team})` : ""}${s.time ? ` د${s.time}` : ""}`)
            .join("، ");
        lines.push(`الأهداف: ${scs}`);
    }
    if (facts.note) lines.push(`ملاحظات: ${facts.note}`);

    const system =
        "أنت محرّر رياضي محترف في موقع كرة قدم عُماني. اكتب خبرًا صحفيًا دقيقًا بالعربية الفصحى " +
        "المبسّطة بنبرة محايدة واحترافية. اعتمد فقط على الحقائق المعطاة ولا تختلق أي معلومة " +
        "(لاعبين، أرقام، تصريحات) غير واردة فيها. أعد ردك بصيغة JSON فقط دون أي نص إضافي.";

    const prompt =
        "حقائق المباراة:\n" + lines.join("\n") + "\n\n" +
        "اكتب خبرًا عن نتيجة هذه المباراة وأعده حصراً بهذا الشكل JSON:\n" +
        '{\n' +
        '  "subject": "عنوان جذّاب قصير (لا يتجاوز 100 حرف)",\n' +
        '  "short_description": "ملخّص في جملة واحدة (لا يتجاوز 160 حرفًا)",\n' +
        '  "description": "الخبر كاملًا من 3 إلى 5 جُمل (لا يتجاوز 900 حرف) يذكر النتيجة والفائز أو التعادل والدور والهدّافين ورجل المباراة إن وُجدوا"\n' +
        "}";

    return { system, prompt };
};

// Robustly pull the JSON object out of a model response (handles ```json fences
// and leading/trailing chatter) and return clamped Blog fields. Throws on junk.
export const parseNewsJSON = (text) => {
    if (!text || !String(text).trim()) throw new Error("لم يُرجِع المولّد أي نص");
    let raw = String(text).trim();
    // Strip a fenced code block if present.
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) raw = fence[1].trim();
    // Otherwise narrow to the outermost {...}.
    if (raw[0] !== "{") {
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start === -1 || end === -1 || end <= start) throw new Error("تعذّر قراءة مخرجات الذكاء الاصطناعي");
        raw = raw.slice(start, end + 1);
    }
    let obj;
    try { obj = JSON.parse(raw); }
    catch { throw new Error("مخرجات الذكاء الاصطناعي ليست بصيغة صحيحة"); }

    const subject = clamp(obj.subject || obj.title || "", NEWS_LIMITS.subject);
    const short_description = clamp(obj.short_description || obj.summary || obj.subtitle || "", NEWS_LIMITS.short_description);
    const description = clamp(obj.description || obj.body || obj.content || "", NEWS_LIMITS.description);
    if (!subject || !description) throw new Error("نص الخبر غير مكتمل");
    return { subject, short_description: short_description || subject, description };
};
