// Which technical-staff member counts as "the head coach" (المدرب).
//
// The role is `classification` (الصفة: مدرب / مساعد مدرب / مدرب اللياقة /
// مدرب حراس / مدير الفريق / طبي …). `occupation` is the member's day job
// (موظف / طالب / عسكري) and only older rows put the role there — matching it
// alone found a coach for 4 clubs out of 13 on production.

const ASSISTANT_COACH = /مساعد|اللياقة|لياقة|حراس|حارس/;

/** Lower rank wins; null = not a head coach at all. */
export const headCoachRank = (staff) => {
    const role = String(staff?.classification || "").trim();
    const job = String(staff?.occupation || "").trim();
    const label = role.includes("مدرب") ? role : job.includes("مدرب") ? job : "";
    if (!label) return null;
    if (ASSISTANT_COACH.test(label)) return null;                 // assistant / fitness / goalkeeping
    if (label === "مدرب") return 0;                               // exactly "مدرب"
    if (label.includes("أول") || label.includes("اول")) return 1; // "مدرب أول"
    return 2;                                                     // any other head-coach wording
};

/** The head coach among the given staff rows, or null. */
export const pickHeadCoach = (staff = []) =>
    staff
        .map((row) => ({ row, rank: headCoachRank(row) }))
        .filter(({ rank }) => rank !== null)
        .sort((a, b) => a.rank - b.rank)[0]?.row || null;
