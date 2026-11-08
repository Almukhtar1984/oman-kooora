// مدة تسجيل الفريق، وما يترتّب على انتهائها.
//
// The club sets a team's registration period when it adds the team. The day
// after the end date the team is suspended: none of its accounts may sign in or
// keep working, until the club activates it again with a new end date
// (the client, 2026-11-08).
//
// Until now «توقيف الفريق» only coloured the card red — the team kept signing
// in. Suspension now means it: the same rule covers a team the club stopped by
// hand and one whose period ran out.
//
// Kept pure where it can be, so the rule is tested without a database.

/** Today in Oman as YYYY-MM-DD — the day a period ends is counted there. */
export const omanToday = (now = new Date()) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat" }).format(now);

/** A DATE value as YYYY-MM-DD, or null when empty. */
export const dayOf = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
};

/** The period is over once its last day has passed. No end date: never. */
export const isRegistrationOver = (end, today = omanToday()) => {
    const last = dayOf(end);
    return Boolean(last && last < today);
};

/**
 * What the period a club sends is missing, or null when it holds.
 * An end date before the start, or one already past, is refused: a team
 * created with it would be suspended the moment it exists. Editing another
 * field of a team whose period already ended sends that same past date back
 * unchanged — `allowPastEnd` lets it through.
 */
export const periodProblem = ({ start, end } = {}, today = omanToday(), { allowPastEnd = false } = {}) => {
    const from = dayOf(start), to = dayOf(end);
    if (start && !from) return "تاريخ بداية التسجيل غير صالح";
    if (end && !to) return "تاريخ نهاية التسجيل غير صالح";
    if (from && to && to < from) return "تاريخ نهاية التسجيل قبل بدايته";
    if (to && to < today && !allowPastEnd) return "تاريخ نهاية التسجيل مضى — اختر تاريخاً قادماً";
    return null;
};

/** The two date fields as the database takes them: empty means none. */
export const normalizePeriod = (content) => {
    for (const key of ["registration_start", "registration_end"]) {
        if (key in (content || {})) content[key] = dayOf(content[key]);
    }
    return content;
};

/**
 * Why this team's accounts may not sign in, or null when they may.
 * @returns {{ code: string, message: string } | null}
 */
export const teamSuspension = (team, today = omanToday()) => {
    if (!team) return null;
    if (isRegistrationOver(team.registration_end, today)) {
        return {
            code: "TEAM_REGISTRATION_ENDED",
            message: `انتهت مدة تسجيل الفريق في \u2066${dayOf(team.registration_end)}\u2069 فتوقف حسابه — راجع النادي لتجديد التسجيل وتفعيل الحساب.`,
        };
    }
    if (team.account_status === false || team.account_status === 0) {
        return {
            code: "TEAM_SUSPENDED",
            message: "حساب الفريق موقوف من النادي — راجع النادي لتفعيله.",
        };
    }
    return null;
};

/**
 * Activating a team whose period is over needs a new end date first, or the
 * night's job would stop it again a few hours later.
 */
export const activationProblem = (current, content, today = omanToday()) => {
    if (content?.account_status !== true) return null;
    const end = "registration_end" in (content || {}) ? content.registration_end : current?.registration_end;
    return isRegistrationOver(end, today)
        ? "انتهت مدة تسجيل هذا الفريق — حدّد تاريخ نهاية جديداً للتسجيل ثم فعّله."
        : null;
};
