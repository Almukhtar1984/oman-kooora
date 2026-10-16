// Pure helper for AI-drafted messages to clubs / teams. Turns a brief into a
// provider prompt and parses the JSON back into {subject, content}. No DB /
// network — unit-tested.

export const MESSAGE_TONES = ["formal", "friendly", "firm"];

const TONE_LABEL = {
    formal: "رسمية مهذّبة",
    friendly: "ودّية",
    firm: "حازمة لكن محترمة",
};
const RECIPIENT_LABEL = { club: "النادي", team: "الفريق" };

// Message model column caps.
export const MESSAGE_LIMITS = { subject: 255, content: 500 };

const clamp = (s, n) => {
    const t = String(s ?? "").trim();
    return t.length <= n ? t : t.slice(0, n - 1).trim() + "…";
};

export const normalizeTone = (tone) => (MESSAGE_TONES.includes(tone) ? tone : "formal");

// Build the {system, prompt} pair for drafting a message. Pure + deterministic.
export const buildMessageDraftPrompt = ({ brief, tone, recipientType, recipientName } = {}) => {
    const body = String(brief || "").trim();
    if (!body) throw new Error("موضوع الرسالة مطلوب");
    const t = normalizeTone(tone);
    const recipient = RECIPIENT_LABEL[recipientType] || "الجهة";
    const named = String(recipientName || "").trim();

    const system =
        "أنت مسؤول مراسلات في اتحاد كرة قدم عُماني. اكتب رسالة رسمية موجزة ومهنية بالعربية " +
        "الفصحى، واضحة ومباشرة. اعتمد فقط على المعطيات ولا تختلق تفاصيل (تواريخ، أرقام، أسماء) " +
        "غير مذكورة. أعد ردك بصيغة JSON فقط دون أي نص إضافي.";

    const lines = [];
    lines.push(`المرسَل إليه: ${recipient}${named ? ` (${named})` : ""}`);
    lines.push(`نبرة الرسالة: ${TONE_LABEL[t]}`);
    lines.push(`موضوع/عناصر الرسالة: ${body}`);

    const prompt =
        "اكتب رسالة رسمية بناءً على ما يلي:\n" + lines.join("\n") + "\n\n" +
        "أعد النتيجة حصراً بهذا الشكل JSON:\n" +
        '{\n' +
        '  "subject": "عنوان الرسالة (لا يتجاوز 100 حرف)",\n' +
        '  "content": "نص الرسالة كاملًا مع التحية والخاتمة (لا يتجاوز 450 حرفًا)"\n' +
        "}";

    return { system, prompt };
};

// Robustly pull {subject, content} out of a model response. Throws on junk.
export const parseMessageJSON = (text) => {
    if (!text || !String(text).trim()) throw new Error("لم يُرجِع المولّد أي نص");
    let raw = String(text).trim();
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) raw = fence[1].trim();
    if (raw[0] !== "{") {
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start === -1 || end === -1 || end <= start) throw new Error("تعذّر قراءة مخرجات الذكاء الاصطناعي");
        raw = raw.slice(start, end + 1);
    }
    let obj;
    try { obj = JSON.parse(raw); }
    catch { throw new Error("مخرجات الذكاء الاصطناعي ليست بصيغة صحيحة"); }

    const subject = clamp(obj.subject || obj.title || "", MESSAGE_LIMITS.subject);
    const content = clamp(obj.content || obj.body || obj.message || "", MESSAGE_LIMITS.content);
    if (!subject || !content) throw new Error("نص الرسالة غير مكتمل");
    return { subject, content };
};
