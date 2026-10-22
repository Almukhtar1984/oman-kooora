// The rule that keeps a club out of another club's teams.
//
// Twenty-seven team names repeat across clubs on this platform ("فريق الاتحاد"
// sits in four of them), so a wrong pick in a list of names is invisible: the
// registration lands in another club's team and nobody can see it from the name.

import { isForeignTeam } from "../src/Helpers/clubScope.mjs";

let pass = 0, fail = 0;
const check = (label, got, want) => {
    if (got === want) { pass++; console.log(`\x1b[32m✓\x1b[0m ${label}`); }
    else { fail++; console.log(`\x1b[31m✗\x1b[0m ${label} — توقعنا ${want} وجاء ${got}`); }
};

const RUSTAQ = "club-rustaq";
const BAHLA = "club-bahla";

check("فريق نادٍ آخر يُرفض", isForeignTeam(RUSTAQ, BAHLA), true);
check("فريق النادي نفسه يمر", isForeignTeam(RUSTAQ, RUSTAQ), false);
check("سوبر-أدمن (بلا نادٍ) لا يُقيَّد", isForeignTeam(null, BAHLA), false);
check("فريق مجهول النادي لا يُرفض", isForeignTeam(RUSTAQ, null), false);
check("بلا نادٍ وبلا فريق", isForeignTeam(null, null), false);
check("قيم فارغة لا تُعدّ تطابقاً", isForeignTeam("", ""), false);
check("تطابق نصّي دقيق لا يتأثر بفراغ", isForeignTeam(RUSTAQ, undefined), false);

console.log(fail ? `\n\x1b[31m${fail} فشل\x1b[0m` : `\n\x1b[32mAll passed\x1b[0m (${pass})`);
process.exit(fail ? 1 : 0);
