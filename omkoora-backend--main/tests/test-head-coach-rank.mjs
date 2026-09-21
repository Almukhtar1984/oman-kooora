#!/usr/bin/env node
/**
 * Which technical-staff member the club page reports as المدرب.
 *
 * Production stores the role in `classification` (الصفة) — "مدرب",
 * "مساعد مدرب", "مدرب اللياقة", "مدرب حراس" … — while `occupation` holds the
 * member's day job (موظف / طالب / عسكري). Matching `occupation` only found a
 * coach for 4 clubs out of 13.
 *
 * Pure unit check — no server, no DB.
 *
 *   node tests/test-head-coach-rank.mjs
 */
import { headCoachRank, pickHeadCoach } from "../src/Helpers/staffRoles.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};

// The real values seen on production (classification).
assert(headCoachRank({ classification: "مدرب", occupation: "موظف" }) === 0, "الصفة 'مدرب' هي المدرب الأول");
assert(headCoachRank({ classification: "مساعد مدرب", occupation: "موظف" }) === null, "مساعد مدرب ليس المدرب");
assert(headCoachRank({ classification: "مدرب اللياقة", occupation: "طالب" }) === null, "مدرب اللياقة ليس المدرب");
assert(headCoachRank({ classification: "مدرب حراس", occupation: "عسكري" }) === null, "مدرب حراس ليس المدرب");
assert(headCoachRank({ classification: "مدير الفريق", occupation: "موظف" }) === null, "مدير الفريق ليس مدرباً");
assert(headCoachRank({ classification: "طبي", occupation: "موظف" }) === null, "الطاقم الطبي ليس مدرباً");
assert(headCoachRank({ classification: "اعلامي", occupation: "موظف" }) === null, "الإعلامي ليس مدرباً");

// Older rows that typed the role into occupation.
assert(headCoachRank({ classification: "", occupation: "مدرب أول" }) === 1, "'مدرب أول' في المهنة يُقبل");
assert(headCoachRank({ classification: null, occupation: "مدرب" }) === 0, "'مدرب' في المهنة يُقبل");
assert(headCoachRank({ classification: null, occupation: "مساعد مدرب" }) === null, "مساعد مدرب في المهنة مرفوض");
assert(headCoachRank({ classification: "", occupation: "موظف" }) === null, "مهنة بلا علاقة بالتدريب مرفوضة");

// The role wins over the day job.
assert(headCoachRank({ classification: "مدرب", occupation: "مساعد مدرب" }) === 0, "الصفة تسبق المهنة");
assert(headCoachRank({ classification: "مساعد مدرب", occupation: "مدرب" }) === null, "صفة المساعد ترفض حتى لو كانت المهنة 'مدرب'");

// Ordering: a plain "مدرب" outranks any other head-coach wording.
const ranks = ["مدرب", "مدرب أول", "المدرب العام"].map((v) => headCoachRank({ classification: v }));
assert(ranks[0] < ranks[1] && ranks[1] <= ranks[2], "الترتيب: مدرب ← مدرب أول ← صياغات أخرى");

// pickHeadCoach over a realistic roster.
const roster = [
    { classification: "مدير الفريق", person: { first_name: "مدير" } },
    { classification: "مساعد مدرب", person: { first_name: "مساعد" } },
    { classification: "مدرب اللياقة", person: { first_name: "لياقة" } },
    { classification: "مدرب", person: { first_name: "المدرب" } },
];
assert(pickHeadCoach(roster)?.person?.first_name === "المدرب", "pickHeadCoach تختار المدرب من بين الطاقم");
assert(pickHeadCoach([{ classification: "طبي" }, { classification: "اعلامي" }]) === null, "طاقم بلا مدرب يرجع null");
assert(pickHeadCoach([]) === null, "طاقم فارغ يرجع null");

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
