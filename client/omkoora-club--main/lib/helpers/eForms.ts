// الاستمارات الإلكترونية — تُختار الاستمارة واللاعب، فتمتلئ.
//
// كانت الاستمارة ملف Word يُنزَّل ويُملأ باليد: الاسم والرقم المدني والهاتف
// والفريق، في كل مرة. والعميل (اجتماع 2026-10-30): «فقط يختار بيانات اللاعب
// وينزل كامل الاستمارة… أربع استمارات: انتقال، إعارة، استقالة، ولي الأمر…
// تكون موجود فيها اللوغو والشعار». وقال إنه سيرسل نماذج موحّدة، فهذه نسخةٌ أولى
// على هيئة الخطاب الرسمي الذي عرضه (استمارة استقالة نادي الرستاق) — والنصوص
// في جدولٍ واحد هنا، فتعديلها حين تصل النماذج سطرٌ لا شاشة.
//
// قرارات محضة: البيانات تدخل، والاستمارة — نصّاً وجداول ثم صفحة طباعة — تخرج.

import dayjs from "dayjs";

export type EFormType = "transfer" | "loan" | "resignation" | "guardian";

export type EFormPerson = {
    first_name?: string | null;
    second_name?: string | null;
    third_name?: string | null;
    tribe?: string | null;
    card_number?: string | null;
    phone?: string | null;
    date_birth?: string | null;
};

export type EFormData = {
    player?: { person?: EFormPerson | null; team?: { name?: string | null } | null } | null;
    club?: { name?: string | null; logo?: string | null } | null;
    team?: { name?: string | null; logo?: string | null } | null;
    // انتقال وإعارة
    toTeam?: string;
    toClub?: string;
    startDate?: string | null;
    endDate?: string | null;
    // استقالة
    reason?: string;
    // ولي الأمر
    guardianName?: string;
    guardianCard?: string;
    guardianPhone?: string;
    guardianRelation?: string;
    season?: string;
    // تاريخ الاستمارة
    date?: string | null;
};

export const FORM_TYPES: { type: EFormType; label: string; hint: string }[] = [
    { type: "transfer", label: "استمارة انتقال", hint: "انتقال لاعب من فريقه إلى فريق آخر" },
    { type: "loan", label: "استمارة إعارة", hint: "إعارة لاعب لمدة محدّدة" },
    { type: "resignation", label: "استمارة استقالة", hint: "استقالة لاعب من عضوية فريقه" },
    { type: "guardian", label: "موافقة ولي الأمر", hint: "موافقة ولي أمر اللاعب القاصر" },
];

export const fullName = (person?: EFormPerson | null) =>
    [person?.first_name, person?.second_name, person?.third_name, person?.tribe]
        .map((part) => String(part || "").trim()).filter(Boolean).join(" ");

// خانةٌ لا قيمة لها تبقى نقاطاً يُكتب عليها باليد — كما في الاستمارة الورقية.
const BLANK = "…………………………";
const or = (value?: string | null) => (String(value ?? "").trim() || BLANK);
const day = (value?: string | null) => (value && dayjs(value).isValid() ? dayjs(value).format("YYYY/MM/DD") : BLANK);

export type EForm = {
    title: string;
    to: string;
    subject: string;
    paragraphs: string[];
    sections: { title: string; rows: [string, string][] }[];
    signatures: string[];
};

/** الاستمارة نصّاً وجداول — بلا صفحة بعد. */
export const buildEForm = (type: EFormType, data: EFormData): EForm => {
    const person = data.player?.person;
    const name = or(fullName(person));
    const club = or(data.club?.name);
    const team = or(data.team?.name || data.player?.team?.name);

    const player: [string, string][] = [
        ["الاسم الرباعي مع القبيلة", name],
        ["الرقم المدني", or(person?.card_number)],
        ["تاريخ الميلاد", day(person?.date_birth)],
        ["رقم الهاتف", or(person?.phone)],
        ["الفريق الحالي", team],
    ];

    switch (type) {
        case "transfer":
            return {
                title: "استمارة انتقال لاعب",
                to: `إلى رئيس ${club} المحترم`,
                subject: "طلب انتقال لاعب",
                paragraphs: [
                    `يتقدّم ${team} بطلب انتقال اللاعب الموضّحة بياناته أدناه إلى ${or(data.toTeam)}`
                    + `${data.toClub ? ` التابع لـ${data.toClub}` : ""}، اعتباراً من ${day(data.startDate)}.`,
                    "ونقرّ بأن البيانات الواردة صحيحة، وأن الطلب لا يُعتمد إلا بموافقة النادي وسداد رسومه.",
                ],
                sections: [
                    { title: "أولاً: بيانات اللاعب", rows: player },
                    {
                        title: "ثانياً: بيانات الانتقال",
                        rows: [
                            ["من فريق", team],
                            ["إلى فريق", or(data.toTeam)],
                            ["النادي المستقبِل", or(data.toClub)],
                            ["تاريخ الانتقال", day(data.startDate)],
                        ],
                    },
                ],
                signatures: ["توقيع اللاعب", "رئيس الفريق المُرسِل", "رئيس الفريق المستقبِل", "اعتماد النادي والختم"],
            };
        case "loan":
            return {
                title: "استمارة إعارة لاعب",
                to: `إلى رئيس ${club} المحترم`,
                subject: "طلب إعارة لاعب",
                paragraphs: [
                    `يتقدّم ${team} بطلب إعارة اللاعب الموضّحة بياناته أدناه إلى ${or(data.toTeam)}`
                    + `${data.toClub ? ` التابع لـ${data.toClub}` : ""}، للفترة من ${day(data.startDate)} إلى ${day(data.endDate)}،`
                    + " ويعود اللاعب إلى فريقه بانقضائها.",
                    "ونقرّ بأن البيانات الواردة صحيحة، وأن الطلب لا يُعتمد إلا بموافقة النادي وسداد رسومه.",
                ],
                sections: [
                    { title: "أولاً: بيانات اللاعب", rows: player },
                    {
                        title: "ثانياً: بيانات الإعارة",
                        rows: [
                            ["الفريق المُعير", team],
                            ["الفريق المستعير", or(data.toTeam)],
                            ["النادي المستعير", or(data.toClub)],
                            ["بداية الإعارة", day(data.startDate)],
                            ["نهاية الإعارة", day(data.endDate)],
                        ],
                    },
                ],
                signatures: ["توقيع اللاعب", "رئيس الفريق المُعير", "رئيس الفريق المستعير", "اعتماد النادي والختم"],
            };
        case "resignation":
            return {
                title: "استمارة استقالة",
                to: `إلى رئيس ${team} المحترم`,
                subject: "طلب استقالة من عضوية الفريق",
                paragraphs: [
                    `أتقدّم إليكم بطلب استقالتي من عضوية ${team}، وذلك للأسباب الآتية: ${or(data.reason)}.`,
                    `وأقرّ بأن البيانات الواردة أدناه صحيحة، وأطلب النظر في استقالتي وفق اللوائح المنظّمة للعلاقة بين ${club} والفرق الأهلية.`,
                ],
                sections: [{ title: "أولاً: بيانات العضو", rows: player }],
                signatures: ["توقيع العضو", "رئيس الفريق", "اعتماد النادي والختم"],
            };
        case "guardian":
        default:
            return {
                title: "موافقة ولي الأمر",
                to: `إلى رئيس ${club} المحترم`,
                subject: "إقرار وموافقة ولي أمر لاعب",
                paragraphs: [
                    `أنا الموقّع أدناه ${or(data.guardianName)}، ولي أمر اللاعب ${name}`
                    + ` (صلة القرابة: ${or(data.guardianRelation)})، أوافق على تسجيله ومشاركته في ${team}`
                    + ` التابع لـ${club} للموسم الرياضي ${or(data.season)}.`,
                    "وأتعهّد بمتابعة التزامه بلوائح النادي والفريق، وأقرّ بصحّة البيانات الواردة أدناه.",
                ],
                sections: [
                    { title: "أولاً: بيانات اللاعب", rows: player },
                    {
                        title: "ثانياً: بيانات ولي الأمر",
                        rows: [
                            ["اسم ولي الأمر", or(data.guardianName)],
                            ["صلة القرابة", or(data.guardianRelation)],
                            ["الرقم المدني", or(data.guardianCard)],
                            ["رقم الهاتف", or(data.guardianPhone)],
                        ],
                    },
                ],
                signatures: ["توقيع ولي الأمر", "رئيس الفريق", "اعتماد النادي والختم"],
            };
    }
};

const escapeHtml = (text: string) => String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * صفحة الاستمارة: خطابٌ رسمي على A4 — شعار النادي يميناً وشعار الفريق يساراً،
 * ثم الموضوع والنصّ والجداول وخانات التوقيع.
 */
export const eFormHtml = (form: EForm, data: EFormData, logos: { club?: string | null; team?: string | null } = {}) => {
    const logo = (src?: string | null, alt = "") =>
        src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">` : `<span class="logo-blank"></span>`;
    const sections = form.sections.map((section) => `
        <h3>${escapeHtml(section.title)}</h3>
        <table>${section.rows.map(([label, value]) => `
            <tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}
        </table>`).join("");
    const signatures = form.signatures.map((label) => `
        <div class="sign"><div class="line"></div><span>${escapeHtml(label)}</span></div>`).join("");

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(form.title)} — ${escapeHtml(fullName(data.player?.person) || "")}</title>
<style>
    @page { size: A4; margin: 14mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: "Tajawal", "Segoe UI", "Geeza Pro", Arial, sans-serif; color: #111827; margin: 0 auto; padding: 24px; max-width: 820px; line-height: 1.9; font-size: 14px; }
    @media print { body { padding: 0; max-width: none; } }
    .head { display: grid; grid-template-columns: 90px 1fr 90px; align-items: center; gap: 12px; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; }
    .head img, .logo-blank { width: 80px; height: 80px; object-fit: contain; display: block; }
    .head .club { text-align: center; }
    .head .club strong { display: block; font-size: 20px; color: #1d4ed8; }
    .head .club span { font-size: 13px; color: #4b5563; }
    .meta { display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin: 10px 0 18px; }
    .to { font-weight: 700; margin: 0; }
    .greet { margin: 0 0 8px; }
    h2 { text-align: center; font-size: 17px; margin: 14px 0; text-decoration: underline; text-underline-offset: 6px; }
    p { margin: 0 0 10px; text-align: justify; }
    h3 { font-size: 15px; margin: 18px 0 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: right; vertical-align: top; }
    th { width: 34%; background: #f3f4f6; font-weight: 600; }
    .signs { display: grid; grid-template-columns: repeat(${Math.min(form.signatures.length, 4)}, 1fr); gap: 18px; margin-top: 44px; }
    .sign { text-align: center; font-size: 12px; color: #374151; }
    .sign .line { border-bottom: 1px dotted #6b7280; height: 44px; margin-bottom: 6px; }
</style>
</head>
<body>
<div class="head">
    ${logo(logos.club, data.club?.name || "")}
    <div class="club"><strong>${escapeHtml(data.club?.name || "النادي")}</strong><span>${escapeHtml(form.title)}</span></div>
    ${logo(logos.team, data.team?.name || "")}
</div>
<div class="meta"><span>التاريخ: ${escapeHtml(day(data.date || dayjs().format("YYYY-MM-DD")))}</span><span>الرقم: ……………</span></div>
<p class="to">${escapeHtml(form.to)}</p>
<p class="greet">السلام عليكم ورحمة الله وبركاته،،</p>
<h2>الموضوع: ${escapeHtml(form.subject)}</h2>
${form.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
${sections}
<div class="signs">${signatures}</div>
</body>
</html>`;
};
