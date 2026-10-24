// Same club, same name — the rule, and what counts as "the same name".
import { normalizeTeamName, isSameTeamName, findTeamNameClash } from "../src/Helpers/teamNaming.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

check("الاسم نفسه", isSameTeamName("فريق الاتفاق", "فريق الاتفاق"), true);
check("فراغات زائدة لا تصنع فريقاً جديداً", isSameTeamName(" فريق   الاتفاق ", "فريق الاتفاق"), true);
check("الهمزة على الألف لا تفرّق", isSameTeamName("فريق الأهلي", "فريق الاهلي"), true);
check("التاء المربوطة والهاء سواء", isSameTeamName("فريق الوحدة", "فريق الوحده"), true);
check("الألف المقصورة والياء سواء", isSameTeamName("فريق المرتضى", "فريق المرتضي"), true);
check("التشكيل لا يغيّر الاسم", isSameTeamName("فريق الاتِّفاق", "فريق الاتفاق"), true);

// Whole words still matter — نادي صحم يملك هذين الاسمين فعلاً، وهما فريقان.
check("كلمة زائدة تعني فريقاً آخر",
    isSameTeamName("فريق الاتفاق الرياضي والثقافي", "فريق الاتفاق الرياضي الثقافي"), false);
check("اسمان مختلفان", isSameTeamName("فريق النصر", "فريق الهلال"), false);
check("الاسم الفارغ لا يطابق شيئاً", isSameTeamName("", ""), false);
check("الفراغ وحده لا يطابق", isSameTeamName("   ", "فريق"), false);

check("التطبيع يرجع صيغة مقارنة", normalizeTeamName("  فريق   الأهلي  "), "فريق الاهلي");

const TEAMS = [
    { id: "t1", name: "فريق الاتفاق" },
    { id: "t2", name: "فريق النصر" },
];
check("يكشف الاسم المحجوز", findTeamNameClash(TEAMS, "فريق الاتفاق")?.id, "t1");
check("يكشفه ولو اختلف الرسم", findTeamNameClash(TEAMS, "فريق الأتفاق")?.id, "t1");
check("اسم جديد يمر", findTeamNameClash(TEAMS, "فريق الشباب"), null);
check("إعادة تسمية الفريق نفسه لا تصطدم بنفسه", findTeamNameClash(TEAMS, "فريق الاتفاق", "t1"), null);
check("لكنها تصطدم باسم فريق آخر", findTeamNameClash(TEAMS, "فريق النصر", "t1")?.id, "t2");
check("قائمة فارغة", findTeamNameClash([], "فريق"), null);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
