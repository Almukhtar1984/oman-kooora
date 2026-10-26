// عدّ الأشخاص مرة واحدة، لا مرة لكل سجل.
//
// الشخص الواحد يكون لاعباً وعضو جمعية في آن، فجمع السجلات الخمسة يعدّه مرتين:
// ولهذا رأى نادٍ «إجمالي الأشخاص 19,520» بينما عضويته الحقيقية 10,117.

import { identityKey, countDistinct, createDistinctCounter } from "../src/Helpers/peopleIdentity.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    if (got === want) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${want} وجاء ${got}`); }
};

// الرقم المدني هو الهوية — وهو ما تستخدمه الأندية نفسها.
check("الرقم المدني يوحّد السجلين",
    identityKey({ card_number: "22161381", id: "a" }), identityKey({ card_number: "22161381", id: "b" }));
check("المسافات حوله لا تصنع شخصاً آخر",
    identityKey({ card_number: " 22161381 " }), identityKey({ card_number: "22161381" }));
check("رقمان مختلفان شخصان",
    identityKey({ card_number: "1" }) === identityKey({ card_number: "2" }), false);

// بلا رقم مدني: يُعدّ ولا يُدمج مع أحد.
check("بلا رقم مدني يرجع إلى معرّفه",
    identityKey({ id: "x1" }, "person"), "person:x1");
check("ورقم فارغ يُعامل كغيابه",
    identityKey({ card_number: "   ", id: "x1" }, "person"), "person:x1");
check("سجلان بلا رقم مدني لا يندمجان",
    identityKey({ id: "x1" }, "person") === identityKey({ id: "x2" }, "person"), false);

check("العدّ المميّز يتجاهل التكرار", countDistinct(["c:1", "c:1", "c:2"]), 2);
check("ويتجاهل الفارغ", countDistinct(["c:1", "", null, undefined]), 1);

// نادٍ فيه لاعب هو نفسه عضو جمعية: شخص واحد لا اثنان.
const counter = createDistinctCounter();
counter.add("club-1", "c:100");   // لاعب
counter.add("club-1", "c:100");   // وعضو جمعية بنفس الرقم
counter.add("club-1", "c:200");
counter.add("club-2", "c:100");   // نفس الشخص في نادٍ آخر — يُعدّ هناك أيضاً
check("النادي يعدّ الشخص مرة", counter.count("club-1"), 2);
check("وكل نادٍ يعدّ أعضاءه", counter.count("club-2"), 1);
check("نادٍ بلا أحد", counter.count("club-9"), 0);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
