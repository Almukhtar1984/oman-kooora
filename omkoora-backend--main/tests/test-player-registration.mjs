#!/usr/bin/env node
/**
 * "مسجّل سابقاً" used to be the answer to every civil number already in the
 * database, even when the person was not a player at all, or was a player
 * sitting on no team. Clubs had no way forward from that message.
 *
 * Pure unit check — no server, no DB.
 *
 *   node tests/test-player-registration.mjs
 */
import {
    ATTACH, DUPLICATE, PHONE_TAKEN, REUSE_PERSON, classifyExistingPerson,
} from "../src/Helpers/playerRegistration.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};
const action = (person, player, input) => classifyExistingPerson(person, player, input)?.action ?? null;

const CARD = "1535903";
const PHONE = "90001111";
const person = (over = {}) => ({ id: "p-1", card_number: CARD, phone: PHONE, ...over });
const typed = (over = {}) => ({ card_number: CARD, phone: PHONE, ...over });

// nobody in the way
assert(action(null, null, typed()) === null, "رقم مدني جديد تماماً → لا مانع");

// the real duplicate: already playing for a team
assert(action(person(), { id: "pl-1", id_team: "t-1" }, typed()) === DUPLICATE,
    "لاعب مسجّل في فريق → مرفوض (هذه حالة انتقال)");

// the two cases the clubs were stuck on
assert(action(person(), { id: "pl-1", id_team: null }, typed()) === ATTACH,
    "لاعب بلا فريق → يُضمّ إلى الفريق المطلوب");
assert(action(person(), null, typed()) === REUSE_PERSON,
    "شخص موجود لكنه ليس لاعباً → يُعاد استخدام سجله");
assert(action(person(), { id: "pl-1", id_team: "" }, typed()) === ATTACH,
    "فريق فارغ نصّياً يُعامل كبلا فريق");

// the phone belongs to someone else
assert(action(person({ card_number: "9999999" }), null, typed()) === PHONE_TAKEN,
    "الهاتف يخص شخصاً آخر → رسالة الهاتف المكرر");
assert(action(person({ card_number: "9999999", phone: "90002222" }), null, typed()) === null,
    "لا تطابق في الرقم المدني ولا الهاتف → لا مانع");

// whitespace must not turn the same person into a stranger
assert(action(person(), null, typed({ card_number: ` ${CARD} ` })) === REUSE_PERSON,
    "مسافات حول الرقم المدني لا تغيّر النتيجة");
assert(action(person({ card_number: "" }), null, typed({ card_number: "" })) === PHONE_TAKEN,
    "رقم مدني فارغ لا يُعدّ تطابقاً");

// the verdict carries a reason for the duplicate case
assert(classifyExistingPerson(person(), { id: "pl-1", id_team: "t-1" }, typed())?.reason === "already on a team",
    "سبب الرفض مذكور في النتيجة");

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
