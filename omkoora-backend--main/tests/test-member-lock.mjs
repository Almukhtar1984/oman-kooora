// بعد اعتماد النادي، لا يملك الفريق تعديل العضو ولا حذفه ولا تحريره.
//
// الاعتماد توقيع النادي على التسجيل: هذا اللاعب، بهذه البيانات، في هذا الفريق.
// فإن بقي الفريق قادراً على تغييره بعدها فقد التوقيع معناه.

import { isLockedForCaller, LOCKED_MESSAGE, LOCKED_CODE } from "../src/Helpers/memberLock.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    if (got === want) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${want} وجاء ${got}`); }
};

const TEAM = "3", CLUB = "2", OWNER = "1";

check("الفريق لا يمسّ سجلاً معتمداً", isLockedForCaller(TEAM, "accepted"), true);
check("الفريق يعدّل سجلاً قيد الانتظار", isLockedForCaller(TEAM, "waiting"), false);
check("وسجلاً بانتظار النادي", isLockedForCaller(TEAM, "waiting_club"), false);
check("وسجلاً مرفوضاً — ليعدّله ويعيد تقديمه", isLockedForCaller(TEAM, "rejected"), false);
check("النادي لا يُقيَّد", isLockedForCaller(CLUB, "accepted"), false);
check("المالك لا يُقيَّد", isLockedForCaller(OWNER, "accepted"), false);
check("حالة مجهولة لا تُقفل", isLockedForCaller(TEAM, undefined), false);
check("دور مجهول لا يُقفل", isLockedForCaller(undefined, "accepted"), false);
check("الرسالة تدلّ على صاحب الصلاحية", LOCKED_MESSAGE.includes("النادي"), true);
check("للرفض رمز يقرؤه العميل", LOCKED_CODE, "APPROVED_RECORD_LOCKED");

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
