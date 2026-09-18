// people.date_birth is a free-text column: besides the YYYY-MM-DD the forms
// write, older and imported rows hold DD/MM/YYYY, Arabic-Indic digits or raw
// Excel serial numbers. `new Date()` turns most of those into an Invalid Date,
// which date inputs then save back as the string "Invalid Date" and
// date-differencer throws on (taking the whole page down).

const toAsciiDigits = (value: string) =>
    value
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

const build = (year: number, month: number, day: number): Date | null => {
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(year, month - 1, day);
    // Rejects overflow such as 31/02 rolling into March.
    return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

// Excel stores dates as days since 1899-12-30.
const fromExcelSerial = (serial: number): Date | null => {
    const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000);
    return build(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
};

export const isValidDate = (value: unknown): value is Date =>
    value instanceof Date && !Number.isNaN(value.getTime());

/** Best-effort parse of a stored date; returns null instead of an Invalid Date. */
export const parseDate = (value: unknown): Date | null => {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date) return isValidDate(value) ? value : null;
    if (typeof value === "number") return value > 0 && value < 100000 ? fromExcelSerial(value) : null;

    const text = toAsciiDigits(String(value)).trim();
    if (!text) return null;

    // YYYY-MM-DD, YYYY/MM/DD, and ISO timestamps (date part only, so the
    // stored day never shifts with the browser's timezone).
    let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:$|[T\s])/);
    if (m) return build(+m[1], +m[2], +m[3]);

    // DD/MM/YYYY is the local convention; fall back to MM/DD/YYYY only when
    // the second part cannot be a month.
    m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (m) {
        const [a, b, year] = [+m[1], +m[2], +m[3]];
        return b > 12 ? build(year, a, b) : build(year, b, a);
    }

    if (/^\d{4,5}(\.\d+)?$/.test(text)) {
        const n = Number(text);
        return n >= 10000 ? fromExcelSerial(n) : null; // a bare 4-digit value is a year, not a date
    }

    const fallback = new Date(text);
    return isValidDate(fallback) ? build(fallback.getFullYear(), fallback.getMonth() + 1, fallback.getDate()) : null;
};

/** Whole years between `birth` and `now`; null when the birth date is unusable. */
export const ageInYears = (birth: unknown, now: Date = new Date()): number | null => {
    const date = parseDate(birth);
    if (!date) return null;
    let years = now.getFullYear() - date.getFullYear();
    const beforeBirthday =
        now.getMonth() < date.getMonth() ||
        (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());
    if (beforeBirthday) years--;
    return years;
};
