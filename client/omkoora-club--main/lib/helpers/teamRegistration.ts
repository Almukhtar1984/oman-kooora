// مدة تسجيل الفريق كما يراها النادي — نفس قاعدة الخادم
// (omkoora-backend--main/src/Helpers/teamRegistration.mjs): آخر يوم ضمن المدة،
// وفي اليوم التالي يتوقف حساب الفريق حتى يجدّده النادي.

import dayjs from "dayjs";

/** Today in Oman as YYYY-MM-DD — the day a period ends is counted there. */
export const omanToday = (now: Date = new Date()): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat" }).format(now);

/** A date value as YYYY-MM-DD, or null when empty or unreadable. */
export const dayOf = (value: unknown): string | null => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : dayjs(value).format("YYYY-MM-DD");
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
};

/** The period is over once its last day has passed. No end date: never. */
export const isRegistrationOver = (end: unknown, today: string = omanToday()): boolean => {
    const last = dayOf(end);
    return Boolean(last && last < today);
};

/** Days left including today: 1 on the last day, 0 once it is over. */
export const daysLeft = (end: unknown, today: string = omanToday()): number | null => {
    const last = dayOf(end);
    if (!last) return null;
    return Math.max(0, dayjs(last).diff(dayjs(today), "day") + 1);
};

const SOON_DAYS = 14;

/** A date kept left-to-right inside Arabic text, whatever punctuation follows it. */
export const ltrDay = (day: string): string => `\u2066${day}\u2069`;

/**
 * What the team card says about the account.
 * A period that ran out reads differently from a team the club stopped by hand,
 * because the way back differs: a new end date, not just «تفعيل».
 */
export const teamAccountState = (
    team: { account_status?: boolean | null; registration_end?: string | null } | null | undefined,
    today: string = omanToday(),
): { label: string; color: string; note: string | null } => {
    const end = dayOf(team?.registration_end);
    if (end && isRegistrationOver(end, today)) {
        return { label: "انتهى التسجيل", color: "red", note: `انتهت مدة التسجيل في ${ltrDay(end)} — جدّدها من «تجديد التسجيل وتفعيله» في قائمة الفريق` };
    }
    if (team && team.account_status === false) {
        return { label: "متوقف", color: "red", note: null };
    }
    const left = daysLeft(end, today);
    if (left !== null && left <= SOON_DAYS) {
        return {
            label: "مفعل",
            color: "green",
            note: left === 1 ? `اليوم آخر يوم في مدة التسجيل (${ltrDay(end as string)})` : `ينتهي التسجيل خلال ${left} يوماً (${ltrDay(end as string)})`,
        };
    }
    return { label: "مفعل", color: "green", note: null };
};

/** The period as the API takes it. */
export const toApiDay = (value: Date | null | undefined): string | null =>
    value ? dayjs(value).format("YYYY-MM-DD") : null;

/** A YYYY-MM-DD from the API as a Date for a date field. */
export const fromApiDay = (value: string | null | undefined): Date | null => {
    const day = dayOf(value);
    return day ? dayjs(day).toDate() : null;
};

/** What is wrong with a period the club typed, or null. */
export const periodError = (
    start: Date | null | undefined,
    end: Date | null | undefined,
    { required = true, today = omanToday(), allowPastEnd = false } = {},
): string | null => {
    if (!end) return required ? "حدّد تاريخ نهاية التسجيل" : null;
    const from = toApiDay(start), to = toApiDay(end) as string;
    if (from && to < from) return "النهاية قبل البداية";
    if (to < today && !allowPastEnd) return "هذا التاريخ مضى — اختر تاريخاً قادماً";
    return null;
};
