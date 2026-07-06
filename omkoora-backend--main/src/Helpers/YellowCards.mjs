// Pure, DB-free core of the "two yellows in two consecutive matches" alert.
//
// Kept separate from the resolver so the tricky part — deciding whether two of a
// player's bookings fall in ADJACENT fixtures of their own team — can be unit
// tested with plain objects instead of a live database.

// Chronological compare: by match date, then by createdAt as a tiebreaker.
export const compareMatches = (a, b) => {
    const da = a.date || "";
    const db = b.date || "";
    if (da !== db) return da < db ? -1 : 1;
    return (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);
};

// matches: [{ id, date, first_team, second_team, createdAt }]
// Returns Map<participatingTeamId, orderedMatches[]>.
export const buildFixturesByTeam = (matches = []) => {
    const byTeam = new Map();
    const add = (ptId, m) => {
        if (!ptId) return;
        if (!byTeam.has(ptId)) byTeam.set(ptId, []);
        byTeam.get(ptId).push(m);
    };
    for (const m of matches) {
        add(m.first_team, m);
        add(m.second_team, m);
    }
    for (const list of byTeam.values()) list.sort(compareMatches);
    return byTeam;
};

// matches: as above. cards: [{ id_match, id_player, player, id_team }] (yellow only).
// Returns [{ key, player, ptId, yellowCount, matchIds: [midA, midB] }] for every
// player booked in two back-to-back fixtures of their team. matchIds is the
// adjacent pair, in fixture order.
export const computeYellowCardAlerts = (matches = [], cards = []) => {
    const fixturesByTeam = buildFixturesByTeam(matches);
    const indexInTeam = (ptId, matchId) =>
        (fixturesByTeam.get(ptId) || []).findIndex((m) => m.id === matchId);

    // Group a player's yellow cards together (keyed by player id).
    const byPlayer = new Map();
    for (const card of cards) {
        const key = card.id_player || card.player;
        if (!key) continue;
        if (!byPlayer.has(key)) {
            byPlayer.set(key, { key, player: card.player, ptId: card.id_team, matchIds: new Set(), yellowCount: 0 });
        }
        const rec = byPlayer.get(key);
        rec.matchIds.add(card.id_match);
        rec.yellowCount++;
    }

    const alerts = [];
    for (const rec of byPlayer.values()) {
        // Positions of the player's booked matches within their team's fixtures.
        const positions = [...rec.matchIds]
            .map((mid) => ({ mid, i: indexInTeam(rec.ptId, mid) }))
            .filter((x) => x.i >= 0)
            .sort((a, b) => a.i - b.i);

        // First pair sitting in adjacent fixtures wins.
        let pair = null;
        for (let k = 1; k < positions.length; k++) {
            if (positions[k].i === positions[k - 1].i + 1) {
                pair = [positions[k - 1].mid, positions[k].mid];
                break;
            }
        }
        if (!pair) continue;

        alerts.push({
            key: rec.key,
            player: rec.player,
            ptId: rec.ptId,
            yellowCount: rec.yellowCount,
            matchIds: pair,
        });
    }
    return alerts;
};
