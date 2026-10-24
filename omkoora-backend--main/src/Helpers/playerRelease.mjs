// Resignation / release of a player from his club ("الاستقالة وإخلاء الطرف").
//
// Until now a player could only leave through a transfer, which needs a club
// willing to take him on the same day. Real life is the other way round: a
// player resigns first, the club releases him, and only then does a new club
// register him. Without that step clubs worked around the system — and a player
// ended up sitting in a club he had resigned from, or in a stranger's team.
//
// The owner's rule: the player's own club decides, alone. No federation step.
//
// Pure decisions only — no DB, no IO — so the rules can be tested directly.

export const RELEASE_WAITING = "waiting";
export const RELEASE_ACCEPTED = "accepted";
export const RELEASE_REJECTED = "rejected";

export const RELEASE_STATUSES = [RELEASE_WAITING, RELEASE_ACCEPTED, RELEASE_REJECTED];

/**
 * May a release be requested for this player right now?
 *
 * @param {object|null} player        the Players row
 * @param {object|null} openRequest   an existing release still waiting, if any
 * @returns {{ok: true} | {ok: false, code: string, message: string}}
 */
export const canRequestRelease = (player, openRequest = null) => {
    if (!player) {
        return { ok: false, code: "PLAYER_NOT_FOUND", message: "اللاعب غير موجود" };
    }
    if (!player.id_team) {
        return {
            ok: false,
            code: "PLAYER_HAS_NO_TEAM",
            message: "هذا اللاعب غير منضم لأي فريق — لا حاجة لإخلاء طرف",
        };
    }
    if (openRequest) {
        return {
            ok: false,
            code: "RELEASE_ALREADY_PENDING",
            message: "يوجد طلب إخلاء طرف قيد الدراسة لهذا اللاعب",
        };
    }
    return { ok: true };
};

/**
 * What a decision does to a waiting request.
 *
 * `frees` is the whole point: accepting is what detaches the player from his
 * team and makes him registrable elsewhere. A decision on anything but a
 * waiting request changes nothing — a release is decided once.
 *
 * @returns {{status: string, frees: boolean, valid: boolean}}
 */
export const releaseDecision = (currentStatus, decision) => {
    if (currentStatus !== RELEASE_WAITING) {
        return { status: currentStatus, frees: false, valid: false };
    }
    if (decision === RELEASE_ACCEPTED) {
        return { status: RELEASE_ACCEPTED, frees: true, valid: true };
    }
    if (decision === RELEASE_REJECTED) {
        return { status: RELEASE_REJECTED, frees: false, valid: true };
    }
    return { status: currentStatus, frees: false, valid: false };
};
