// Two teams in one club may not carry the same name.
//
// Across clubs a repeated name is normal — twenty-seven names are shared, four
// clubs have a "فريق الاتحاد" — and that is already handled by scoping writes to
// the caller's club. Inside a single club it is only ever a mistake: nothing on
// screen distinguishes the two, so players, staff and transfers land in whichever
// one the list happened to show first.
//
// Spelling is not identity here: "فريق الأهلي" and "فريق الاهلي" are the same
// team to everyone except a byte comparison, so names are compared normalised.

const DIACRITICS = /[ؗ-ًؚ-ْٰـ]/g;   // tashkeel + tatweel

/**
 * The form two names are compared in. Pure — no DB, no IO.
 *
 * Unifies the alef forms (أ إ آ → ا), ى → ي and ة → ه, drops tashkeel and the
 * tatweel stretch, collapses runs of whitespace and trims. A difference of a
 * whole word (الرياضي والثقافي vs الرياضي الثقافي) survives: those are two
 * different names, and the club meant them to be.
 */
export const normalizeTeamName = (name) =>
    String(name ?? "")
        .replace(DIACRITICS, "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

/** Do these two names name the same team? */
export const isSameTeamName = (a, b) => {
    const left = normalizeTeamName(a);
    return Boolean(left) && left === normalizeTeamName(b);
};

/**
 * The team in `teams` that already carries `name`, ignoring `exceptTeamId`
 * (the row being renamed), or null when the name is free.
 *
 * @param {Array<{id: string, name: string}>} teams  the club's teams
 */
export const findTeamNameClash = (teams = [], name, exceptTeamId = null) =>
    teams.find((team) => team?.id !== exceptTeamId && isSameTeamName(team?.name, name)) || null;
