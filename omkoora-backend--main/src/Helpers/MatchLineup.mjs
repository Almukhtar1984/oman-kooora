// Pure, DB-free formatting for the per-match player list (the printable lineup).
// Kept separate from the resolver so the name-building / ordering can be unit
// tested with plain objects.

export const fullName = (person) =>
    [person?.first_name, person?.second_name, person?.third_name, person?.tribe]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

// row: { starter, sub, number, player_center, person }
export const toLineupPlayer = (row) => ({
    name: fullName(row?.person),
    number: row?.number != null && row?.number !== "" ? String(row.number) : "",
    position: row?.player_center || "",
    starter: Boolean(row?.starter),
    sub: Boolean(row?.sub),
});

// Starters first, then substitutes; within each group by shirt number ascending
// (players with no number sink to the bottom of their group).
export const sortLineup = (players = []) => {
    const rank = (p) => (p.starter ? 0 : p.sub ? 1 : 2);
    const num = (p) => {
        const n = parseInt(p.number, 10);
        return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    };
    return [...players].sort((a, b) => {
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return num(a) - num(b);
    });
};

// Convenience: rows straight from Sequelize -> print-ready, ordered list.
export const buildLineup = (rows = []) => sortLineup(rows.map(toLineupPlayer));
