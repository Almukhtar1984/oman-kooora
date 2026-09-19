#!/usr/bin/env node
/**
 * Unit test for the stadium booking helpers (no server, no DB).
 *
 * The mobile app draws every slot of the day and greys out the taken ones, so
 * buildTimeSlots must return the whole day with an `is_available` flag and the
 * slot price (stadiums.rent is the hourly rate).
 *
 *   node tests/test-time-slots.mjs
 */
import { bookingPrice, buildTimeSlots, durationMinutes, toMinutes } from "../src/Helpers/timeSlots.mjs";

const c = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m" };
let failures = 0;
const assert = (cond, msg) => {
    if (cond) console.log(`${c.green}✓${c.reset} ${msg}`);
    else { console.log(`${c.red}✗${c.reset} ${msg}`); failures++; }
};
const eq = (actual, expected, msg) =>
    assert(JSON.stringify(actual) === JSON.stringify(expected), `${msg} (got ${JSON.stringify(actual)})`);

const stadium = { start_time: "08:00:00", end_time: "12:00:00", rent: 50 };
const labels = (slots) => slots.map((s) => `${s.label}${s.is_available ? "" : "*"}`).join(" ");

// ---- slot generation ----
eq(labels(buildTimeSlots(stadium, [])), "08:00 09:00 10:00 11:00", "a free day yields one slot per hour");
eq(buildTimeSlots(stadium, [])[0], { label: "08:00", start_time: "08:00", end_time: "09:00", is_available: true, price: 50 },
   "a slot carries its window and hourly price");

// ---- reservations block their slots ----
const booked = [{ booking_start: "09:00:00", booking_end: "11:00:00", status: "accepted" }];
eq(labels(buildTimeSlots(stadium, booked)), "08:00 09:00* 10:00* 11:00", "a booking marks exactly its own slots taken");
assert(buildTimeSlots(stadium, booked).length === 4, "taken slots are still returned (greyed out, not dropped)");
eq(labels(buildTimeSlots(stadium, [{ booking_start: "09:00:00", booking_end: "11:00:00", status: "cancel" }])),
   "08:00 09:00 10:00 11:00", "a cancelled booking frees its slots");
eq(labels(buildTimeSlots(stadium, [{ booking_start: "09:30:00", booking_end: "10:15:00", status: "waiting" }])),
   "08:00 09:00* 10:00* 11:00", "a booking that straddles slots blocks both");

// ---- stadium settings ----
eq(labels(buildTimeSlots({ ...stadium, min_booking_minutes: 120 }, [])), "08:00 10:00",
   "min_booking_minutes sets the slot length");
eq(buildTimeSlots({ ...stadium, min_booking_minutes: 30 }, [])[0].price, 25, "a half-hour slot costs half the hourly rate");
eq(labels(buildTimeSlots({ start_time: "22:00:00", end_time: "02:00:00", rent: 10 }, [])),
   "22:00 23:00 00:00 01:00", "a stadium open past midnight still yields one range");
eq(buildTimeSlots({ start_time: "bad", end_time: "12:00", rent: 10 }, []), [], "unreadable hours yield no slots");
eq(buildTimeSlots({ ...stadium, rent: null }, [])[0].price, null, "no rent means no price (not NaN)");

// ---- small helpers ----
eq(toMinutes("08:30:00"), 510, "toMinutes reads HH:mm:ss");
eq(toMinutes("nope"), null, "toMinutes rejects junk");
eq(durationMinutes("10:00:00", "12:00:00"), 120, "durationMinutes counts whole minutes");
eq(durationMinutes("23:00:00", "01:00:00"), 120, "durationMinutes handles crossing midnight");
eq(durationMinutes("10:00:00", "oops"), null, "durationMinutes returns null on junk");
eq(bookingPrice(50, 120), 100, "bookingPrice = hourly rate x hours");
eq(bookingPrice(33.5, 90), 50.25, "bookingPrice rounds to 2 decimals");
eq(bookingPrice(null, 60), null, "bookingPrice returns null without a rate");

console.log(failures === 0 ? `\n${c.green}All passed${c.reset}` : `\n${c.red}${failures} failed${c.reset}`);
process.exit(failures === 0 ? 0 : 1);
