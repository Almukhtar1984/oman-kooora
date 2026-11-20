// «ملف الطلب» في درج التتبّع: يرى النادي ما أرسله الفريق قبل القبول المبدئي
// (فيديو العميل 2026-11-18).
//
//   node tests/test-request-file.mjs

import {
    ageOn, fileKind, memberFile, playerFile, releaseFile, teamFile, transferFile,
} from "../src/Helpers/requestFile.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

const today = new Date(2026, 10, 18);
const valueOf = (file, label) => file.fields.find((field) => field.label === label)?.value ?? null;
const docLabels = (file) => file.documents.map((doc) => doc.label);

// ── العمر ونوع الملف ────────────────────────────────────────────────────
check("العمر من 2008-05-11", ageOn("2008-05-11", today), 18);
check("العمر قبل يوم الميلاد هذه السنة", ageOn("2008-12-01", today), 17);
check("العمر من 11/05/2010", ageOn("11/05/2010", today), 16);
check("تاريخ لا يُقرأ → null", ageOn("غير معروف", today), null);
check("الصورة تُعرض صورة", fileKind("a1b2.PNG"), "image");
check("الـPDF رابط", fileKind("letter.pdf"), "file");
check("بلا امتداد رابط", fileKind("letter"), "file");

// ── تسجيل عضو جديد ──────────────────────────────────────────────────────
// الحالة التي في الفيديو: الفريق أرسل البيانات ولم يرفق البطاقة.
const member = memberFile({
    first_name: "يونس", second_name: "عبدالله", third_name: "مبارك", tribe: "الهنائي",
    card_number: "12345678", date_birth: "1990-03-04", phone: "99112233", gender: "male",
    nationalID: null, nationalIDBack: null, personal_picture: null,
    team: { name: "فريق النصر" },
}, { today });
check("اسم العضو كاملاً", valueOf(member, "الاسم"), "يونس عبدالله مبارك الهنائي");
check("تاريخ الميلاد مع العمر", valueOf(member, "تاريخ الميلاد"), "1990-03-04 (36 سنة)");
check("الجنس بالعربية", valueOf(member, "الجنس"), "ذكر");
check("فريقه", valueOf(member, "الفريق"), "فريق النصر");
check("الحقل الفارغ غير المطلوب لا يُعرض", valueOf(member, "رقم العضوية"), null);
check("ما لم يُرفق يُسمّى", member.missing,
    ["البطاقة المدنية — الوجه الأمامي", "البطاقة المدنية — الوجه الخلفي", "الصورة الشخصية", "استمارة طلب العضوية"]);
check("ولا مستندات تُعرض", member.documents, []);

const complete = memberFile({
    first_name: "س", second_name: "ع", tribe: "ق", card_number: "1", date_birth: "2000-01-01", phone: "9",
    nationalID: "f.jpg", nationalIDBack: "b.JPEG", personal_picture: "p.png", membership_form: "form.pdf",
}, { today });
check("العضو المكتمل: لا ناقص", complete.missing, []);
check("ومستنداته: ثلاث صور واستمارة", complete.documents.map((doc) => doc.kind), ["image", "image", "image", "file"]);
check("وصورته في رأس الملف", complete.photo, "p.png");
// الاستمارتان (العميل، 2026-11-19): تعهد ولي الأمر لمن هو دون 18، والمرفقات الأخرى تُعرض.
const minorMember = memberFile({
    first_name: "محمد", second_name: "مرزوق", tribe: "الحراصي", card_number: "1", date_birth: "2014-01-07", phone: "9",
    nationalID: "f.jpg", nationalIDBack: "b.jpg", personal_picture: "p.png", membership_form: "form.pdf",
}, { extras: ["guardian-card.jpg"], today });
check("العضو دون 18 بلا تعهد ولي الأمر → ناقص", minorMember.missing, ["تعهد ولي الأمر"]);
check("ومرفقاته الأخرى في الملف", minorMember.documents.map((doc) => doc.label).slice(-2), ["استمارة طلب العضوية", "مرفق 1"]);
check("ومع التعهد يكتمل", memberFile({
    first_name: "س", second_name: "ع", tribe: "ق", card_number: "1", date_birth: "2014-01-07", phone: "9",
    nationalID: "f.jpg", nationalIDBack: "b.jpg", personal_picture: "p.png", membership_form: "form.pdf", guardian_form: "g.pdf",
}, { today }).missing, []);
check("بلا رقم مدني يُذكر ناقصاً", memberFile({ first_name: "س" }, { today }).missing.includes("الرقم المدني"), true);

// ── تسجيل لاعب ──────────────────────────────────────────────────────────
const minor = playerFile({
    nationalID: "f.jpg", nationalIDBack: "b.jpg", parentApproval: null, class: "rookies",
    person: { first_name: "أحمد", second_name: "سالم", tribe: "البلوشي", card_number: "555", date_birth: "2012-02-02" },
    team: { name: "فريق الشباب" },
}, { extras: ["x.pdf"], today });
check("القاصر بلا موافقة ولي الأمر → ناقص", minor.missing, ["موافقة ولي الأمر"]);
check("درجته بالعربية", valueOf(minor, "الدرجة"), "تحت 16 سنة");
check("مرفقاته الأخرى تُعرض", docLabels(minor), ["البطاقة المدنية — الوجه الأمامي", "البطاقة المدنية — الوجه الخلفي", "مرفق 1"]);
const adult = playerFile({
    nationalID: "f.jpg", nationalIDBack: null,
    person: { first_name: "خالد", tribe: "العبري", card_number: "777", date_birth: "1999-01-01" },
}, { today });
check("البالغ لا تُطلب له موافقة ولي الأمر، والوجه الخلفي ناقص", adult.missing, ["البطاقة المدنية — الوجه الخلفي"]);

// ── الانتقال والإعارة ───────────────────────────────────────────────────
const loan = transferFile({
    transition_type: "loan", type: "external",
    id_team_from: "t1", id_club_from: "c1", id_team_to: null, id_club_to: "c2",
    date_start: "2026-11-01", date_end: null,
    player: { person: { first_name: "قصي", tribe: "الرواحي" } },
}, { teams: { t1: "فريق النصر" }, clubs: { c1: "نادي الرستاق", c2: "نادي بهلاء" }, today });
check("نوع الطلب", valueOf(loan, "نوع الطلب"), "إعارة");
check("من: الفريق ونادِيه بين ناديين", valueOf(loan, "من"), "فريق النصر — نادي الرستاق");
check("إلى: نادٍ لم يختر فريقه بعد", valueOf(loan, "إلى"), "نادي بهلاء — يختار النادي فريقه");
check("الإعارة بلا نهاية → ناقص", loan.missing, ["نهاية الإعارة"]);
const internal = transferFile({
    transition_type: "transition", type: "internal", id_team_from: "t1", id_team_to: "t2", id_club_from: "c1", id_club_to: "c1",
    date_start: "2026-11-01", player: { person: { first_name: "س" } },
}, { teams: { t1: "النصر", t2: "الجزيرة" }, clubs: { c1: "نادي الرستاق" }, today });
check("داخل النادي: أسماء الفرق وحدها", [valueOf(internal, "من"), valueOf(internal, "إلى")], ["النصر", "الجزيرة"]);
check("ولا تواريخ إعارة لانتقال", valueOf(internal, "بداية الإعارة"), null);

// ── الاستقالة ───────────────────────────────────────────────────────────
const release = releaseFile({
    reason: "ظروف العمل", letter: null, requested_at: new Date("2026-11-17T08:00:00Z"),
    player: { person: { first_name: "س", tribe: "ق" } }, team: { name: "فريق النصر" },
}, { today });
check("سبب الاستقالة وتاريخها", [valueOf(release, "سبب الاستقالة"), valueOf(release, "تاريخ الطلب")], ["ظروف العمل", "2026-11-17"]);
check("بلا خطاب → ناقص", release.missing, ["خطاب الاستقالة"]);
check("الخطاب PDF رابطٌ لا صورة", releaseFile({ reason: "r", letter: "l.PDF", player: {} }, { today }).documents[0].kind, "file");

// ── تسجيل فريق ──────────────────────────────────────────────────────────
const team = teamFile({
    name: "فريق النصر", manager_name: "سالم", phone: "99", category: 2, logo: "logo.png",
    registration_start: "2026-01-01", registration_end: "2026-12-31",
});
check("درجة الفريق", valueOf(team, "الدرجة"), "الدرجة الثانية");
check("مدة التسجيل بالعربية لا بسهم", valueOf(team, "مدة التسجيل"), "من 2026-01-01 إلى 2026-12-31");
check("شعاره في رأس الملف، ولا ناقص", [team.photo, team.missing], ["logo.png", []]);
check("فريق بلا مدير ولا هاتف", teamFile({ name: "ف" }).missing, ["مدير الفريق", "رقم الهاتف"]);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
