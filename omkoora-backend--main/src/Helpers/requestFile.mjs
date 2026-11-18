// «ملف الطلب»: ما قدّمه الفريق، يراه النادي قبل أن يقرّر.
//
// قال العميل في 2026-11-18: «أنا لما أفتح المسار هو طوالي يعمل لي قبول مبدئي من
// دون ما أشوف الملف بتاعه… لا أريد أن أعمل قبول مبدئي ويكون المعاملة بتاعته ما
// مكتملة». فصار درج التتبّع يعرض الملف نفسه قبل الأزرار: بياناته ومستنداته، وما
// يُنتظر في هذا النوع من الطلبات ولم يُرفق.
//
// هذه الدوال قرارات محضة: الـresolver يجلب السجلات، والملف يُبنى هنا.

const CLASS_LABEL = {
    firstDegree: "الفريق الأول",
    secondDegree: "تحت 23 سنة",
    young: "تحت 18 سنة",
    rookies: "تحت 16 سنة",
};
const GENDER_LABEL = { male: "ذكر", female: "أنثى" };
const TRANSITION_LABEL = { transition: "انتقال", loan: "إعارة", returning: "عودة من الإعارة" };
const TEAM_CATEGORY = ["الدرجة الأولى", "الدرجة الثانية", "الدرجة الثالثة"];

const IMAGE_TYPES = ["JPG", "JPEG", "PNG", "GIF", "WEBP"];

/** هل يُعرض المستند صورةً أم رابطاً لملف (PDF أو Word)؟ */
export const fileKind = (name) => {
    const parts = String(name || "").split(".");
    return parts.length > 1 && IMAGE_TYPES.includes(parts[parts.length - 1].toUpperCase()) ? "image" : "file";
};

const present = (value) => value !== null && value !== undefined && String(value).trim() !== "";

export const fullName = (person) =>
    [person?.first_name, person?.second_name, person?.third_name, person?.tribe]
        .filter(present).map((part) => String(part).trim()).join(" ") || null;

/**
 * العمر بالسنين في يومٍ معيّن، أو null حين لا يُقرأ التاريخ.
 * تاريخ الميلاد يرد بصيغتين: «2008-05-11» من الأعضاء و«11/05/2008» من بعض اللاعبين.
 */
export const ageOn = (birth, today = new Date()) => {
    const text = String(birth ?? "").trim();
    let year; let month; let day;
    let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) {
        [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    } else if ((match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) {
        [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
    } else {
        return null;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    let age = today.getFullYear() - year;
    const thisMonth = today.getMonth() + 1;
    if (thisMonth < month || (thisMonth === month && today.getDate() < day)) age -= 1;
    return age >= 0 && age < 120 ? age : null;
};

const dayOf = (value) => {
    if (!present(value)) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    return String(value).trim().slice(0, 10);
};

const birthText = (birth, today) => {
    if (!present(birth)) return null;
    const age = ageOn(birth, today);
    return age === null ? String(birth).trim() : `${String(birth).trim()} (${age} سنة)`;
};

/**
 * يجمع الملف من أجزائه.
 * - fields:    [التسمية، القيمة، مطلوب؟]. الفارغ لا يُعرض.
 * - documents: [التسمية، اسم الملف، مطلوب؟]. المرفق يُعرض.
 * وما كان مطلوباً وجاء فارغاً يُذكر في missing بتسميته.
 */
export const assemble = ({ photo = null, fields = [], documents = [] }) => {
    const missing = [];
    const shownFields = [];
    fields.forEach(([label, value, required]) => {
        if (present(value)) shownFields.push({ label, value: String(value).trim() });
        else if (required) missing.push(label);
    });
    const shownDocuments = [];
    documents.forEach(([label, file, required]) => {
        if (present(file)) shownDocuments.push({ label, file: String(file), kind: fileKind(file) });
        else if (required) missing.push(label);
    });
    return { photo: present(photo) ? String(photo) : null, fields: shownFields, documents: shownDocuments, missing };
};

/** «تسجيل عضو جديد»: سجلّ العضوية كما أرسله الفريق. */
export const memberFile = (member, { today = new Date() } = {}) => assemble({
    photo: member?.personal_picture,
    fields: [
        ["الاسم", fullName(member), true],
        ["الرقم المدني", member?.card_number, true],
        ["تاريخ الميلاد", birthText(member?.date_birth, today), true],
        ["رقم الهاتف", member?.phone, true],
        ["الجنس", GENDER_LABEL[member?.gender] || null, false],
        ["الفريق", member?.team?.name, false],
        ["رقم العضوية", member?.membership_number, false],
    ],
    documents: [
        ["البطاقة المدنية — الوجه الأمامي", member?.nationalID, true],
        ["البطاقة المدنية — الوجه الخلفي", member?.nationalIDBack, true],
        ["الصورة الشخصية", member?.personal_picture, true],
    ],
});

/** «تسجيل لاعب جديد»: بياناته ومستنداته. موافقة ولي الأمر تُنتظر لمن هو دون 18. */
export const playerFile = (player, { extras = [], today = new Date() } = {}) => {
    const person = player?.person || {};
    const age = ageOn(person.date_birth, today);
    const minor = age !== null && age < 18;
    return assemble({
        photo: person.personal_picture,
        fields: [
            ["الاسم", fullName(person), true],
            ["الرقم المدني", person.card_number, true],
            ["تاريخ الميلاد", birthText(person.date_birth, today), true],
            ["رقم الهاتف", person.phone, false],
            ["الفريق", player?.team?.name, false],
            ["الدرجة", CLASS_LABEL[player?.class] || null, false],
            ["مركز اللاعب", player?.player_center, false],
            ["النشاط", player?.activity, false],
            ["الوظيفة", player?.job, false],
            ["ملاحظات", player?.note, false],
        ],
        documents: [
            ["البطاقة المدنية — الوجه الأمامي", player?.nationalID, true],
            ["البطاقة المدنية — الوجه الخلفي", player?.nationalIDBack, true],
            ["موافقة ولي الأمر", player?.parentApproval, minor],
            ["صورة البطاقة", person.card_image, false],
            ...extras.map((file, index) => [`مرفق ${index + 1}`, file, false]),
        ],
    });
};

/** الانتقال والإعارة: اللاعب، ومن أين وإلى أين. */
export const transferFile = (transfer, { teams = {}, clubs = {}, today = new Date() } = {}) => {
    const player = transfer?.player || {};
    const person = player.person || {};
    const external = transfer?.type === "external";
    const side = (idTeam, idClub) => {
        const team = idTeam ? teams[idTeam] : null;
        const club = idClub ? clubs[idClub] : null;
        if (team && external && club) return `${team} — ${club}`;
        return team || club || null;
    };
    const loan = transfer?.transition_type === "loan";
    return assemble({
        photo: person.personal_picture,
        fields: [
            ["اللاعب", fullName(person), true],
            ["الرقم المدني", person.card_number, false],
            ["تاريخ الميلاد", birthText(person.date_birth, today), false],
            ["نوع الطلب", TRANSITION_LABEL[transfer?.transition_type] || null, false],
            ["من", side(transfer?.id_team_from, transfer?.id_club_from), false],
            ["إلى", transfer?.id_team_to || !clubs[transfer?.id_club_to]
                ? side(transfer?.id_team_to, transfer?.id_club_to)
                : `${clubs[transfer.id_club_to]} — يختار النادي فريقه`, false],
            ["بداية الإعارة", loan ? dayOf(transfer?.date_start) : null, false],
            ["نهاية الإعارة", loan ? dayOf(transfer?.date_end) : null, loan],
        ],
        documents: [
            ["البطاقة المدنية — الوجه الأمامي", player.nationalID, false],
            ["البطاقة المدنية — الوجه الخلفي", player.nationalIDBack, false],
        ],
    });
};

/** استقالة اللاعب: سببها وخطابها. */
export const releaseFile = (release, { today = new Date() } = {}) => {
    const person = release?.player?.person || {};
    return assemble({
        photo: person.personal_picture,
        fields: [
            ["اللاعب", fullName(person), true],
            ["الرقم المدني", person.card_number, false],
            ["تاريخ الميلاد", birthText(person.date_birth, today), false],
            ["الفريق", release?.team?.name, false],
            ["سبب الاستقالة", release?.reason, true],
            ["تاريخ الطلب", dayOf(release?.requested_at), false],
        ],
        documents: [
            ["خطاب الاستقالة", release?.letter, true],
        ],
    });
};

/** «تسجيل فريق»: بياناته كما أُدخلت. */
export const teamFile = (team) => {
    const category = Number(team?.category);
    const start = dayOf(team?.registration_start);
    const end = dayOf(team?.registration_end);
    return assemble({
        photo: team?.logo,
        fields: [
            ["اسم الفريق", team?.name, true],
            ["مدير الفريق", team?.manager_name, true],
            ["رقم الهاتف", team?.phone, true],
            ["النشاط", team?.activities, false],
            ["الدرجة", category >= 1 && category <= TEAM_CATEGORY.length ? TEAM_CATEGORY[category - 1] : null, false],
            ["مدة التسجيل", start || end ? `من ${start || "—"} إلى ${end || "—"}` : null, false],
            ["الوصف", team?.descreption, false],
        ],
        documents: [],
    });
};
