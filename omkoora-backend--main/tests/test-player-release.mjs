// قواعد الاستقالة / إخلاء الطرف — بلا قاعدة بيانات.
//
// القاعدة التي حسمها المالك: النادي صاحب اللاعب هو من يعتمد، وحده. والاعتماد
// هو ما يحرّر اللاعب فعلياً من فريقه ويجعله قابلاً للتسجيل في نادٍ جديد.

import {
    canRequestRelease, releaseDecision,
    RELEASE_WAITING, RELEASE_ACCEPTED, RELEASE_REJECTED, RELEASE_STATUSES,
} from "../src/Helpers/playerRelease.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${JSON.stringify(want)} وجاء ${JSON.stringify(got)}`); }
};

const player = (over = {}) => ({ id: "p1", id_team: "t1", status: "accepted", ...over });

// ───────────── من يجوز له طلب إخلاء طرف ─────────────
check("لاعب في فريق يمكن طلب إخلاء طرفه", canRequestRelease(player()).ok, true);
check("لاعب غير موجود", canRequestRelease(null).code, "PLAYER_NOT_FOUND");
check("لاعب بلا فريق لا يحتاج إخلاء طرف",
    canRequestRelease(player({ id_team: null })).code, "PLAYER_HAS_NO_TEAM");
check("طلب قائم يمنع طلباً ثانياً",
    canRequestRelease(player(), { id: "r1", status: RELEASE_WAITING }).code, "RELEASE_ALREADY_PENDING");
check("ورسالة الرفض مفهومة للنادي",
    canRequestRelease(player({ id_team: null })).message, "هذا اللاعب غير منضم لأي فريق — لا حاجة لإخلاء طرف");

// ───────────── قرار النادي ─────────────
check("الاعتماد يحرّر اللاعب",
    releaseDecision(RELEASE_WAITING, RELEASE_ACCEPTED), { status: "accepted", frees: true, valid: true });
check("الرفض لا يحرّره",
    releaseDecision(RELEASE_WAITING, RELEASE_REJECTED), { status: "rejected", frees: false, valid: true });
check("قرار غير مفهوم لا يغيّر شيئاً",
    releaseDecision(RELEASE_WAITING, "maybe"), { status: "waiting", frees: false, valid: false });

// يُبتّ في الطلب مرة واحدة — ولا يتحرّر اللاعب مرتين.
check("طلب معتمد لا يُعتمد ثانية",
    releaseDecision(RELEASE_ACCEPTED, RELEASE_ACCEPTED), { status: "accepted", frees: false, valid: false });
check("طلب مرفوض لا يُقلب اعتماداً",
    releaseDecision(RELEASE_REJECTED, RELEASE_ACCEPTED), { status: "rejected", frees: false, valid: false });
check("طلب معتمد لا يُرفض بعدها",
    releaseDecision(RELEASE_ACCEPTED, RELEASE_REJECTED), { status: "accepted", frees: false, valid: false });

check("الحالات الثلاث معلنة", RELEASE_STATUSES, ["waiting", "accepted", "rejected"]);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
