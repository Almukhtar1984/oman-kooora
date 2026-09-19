// Booking slots for one stadium on one day.
//
// The mobile app draws every slot of the day and greys out the taken ones, so
// the builder returns ALL slots with an `is_available` flag (the older query
// returned only the free ones as plain strings).
//
// Pricing rule: `stadiums.rent` is the price per hour, so a slot costs
// rent * (slot minutes / 60).

const HHMM = /^(\d{1,2}):(\d{2})/;

/** "08:00:00" | "08:00" -> minutes since midnight; null when unreadable. */
export const toMinutes = (time) => {
    const m = HHMM.exec(String(time ?? "").trim());
    if (!m) return null;
    const hours = Number(m[1]);
    const minutes = Number(m[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
};

/** 510 -> "08:30" */
export const toLabel = (minutes) => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const round2 = (n) => Math.round(n * 100) / 100;

/** Number() turns null/""/undefined into 0 — a missing rate must stay missing. */
const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

/**
 * @param {object}   stadium      { start_time, end_time, rent, min_booking_minutes }
 * @param {object[]} reservations [{ booking_start, booking_end, status }]
 * @param {number}   slotMinutes  slot length (defaults to the stadium's minimum, else 60)
 * @returns {{label, start_time, end_time, is_available, price}[]}
 */
export const buildTimeSlots = (stadium, reservations = [], slotMinutes) => {
    const open = toMinutes(stadium?.start_time);
    const close = toMinutes(stadium?.end_time);
    const step = Number(slotMinutes || stadium?.min_booking_minutes || 60);
    if (open === null || close === null || !Number.isFinite(step) || step <= 0) return [];

    // A stadium that closes after midnight (e.g. 16:00 -> 02:00) still yields
    // one continuous range.
    const end = close > open ? close : close + 24 * 60;

    // Cancelled bookings do not block a slot.
    const taken = reservations
        .filter((r) => r?.status !== "cancel")
        .map((r) => {
            const from = toMinutes(r?.booking_start);
            let to = toMinutes(r?.booking_end);
            if (from === null || to === null) return null;
            if (to <= from) to += 24 * 60;
            return { from, to };
        })
        .filter(Boolean);

    const hourlyRate = toNumber(stadium?.rent);
    const price = hourlyRate === null ? null : round2((hourlyRate * step) / 60);

    const slots = [];
    for (let start = open; start + step <= end; start += step) {
        const stop = start + step;
        const overlaps = taken.some((r) => start < r.to && stop > r.from);
        slots.push({
            label: toLabel(start),
            start_time: toLabel(start),
            end_time: toLabel(stop),
            is_available: !overlaps,
            price,
        });
    }
    return slots;
};

/** Whole minutes between two "HH:mm(:ss)" times; null when unreadable. */
export const durationMinutes = (start, end) => {
    const from = toMinutes(start);
    let to = toMinutes(end);
    if (from === null || to === null) return null;
    if (to <= from) to += 24 * 60; // crosses midnight
    return to - from;
};

/** rent (per hour) * booked hours; null when either input is missing. */
export const bookingPrice = (hourlyRate, minutes) => {
    const rate = toNumber(hourlyRate);
    const mins = toNumber(minutes);
    if (rate === null || mins === null) return null;
    return round2((rate * mins) / 60);
};
