// Pure state machine for the player/technical transfer & loan approval chain.
// The owner's rule: a move goes teamA → clubA → clubB → teamB. The player's own
// club must approve before the destination club. No DB/IO here — unit-tested.
//
// Transfer.status values:
//   waiting_club_from  — created by a team, pending the player's OWN club (clubA)
//   waiting_club_to    — clubA approved, pending the destination club (clubB)
//   accepted           — clubB approved → player moved to teamB (final)
//   rejected           — rejected at any stage (final)
//   waiting            — legacy single-stage value (treated as a final-approval step)

export const TRANSFER_STATUSES = [
    "accepted", "rejected", "waiting", "waiting_club_from", "waiting_club_to",
];

// The subject (player/member/technical) status while a move is in flight.
export const SUBJECT_PENDING = "waiting_club";

// Initial status for a newly created transfer/loan.
//  - A CLUB that creates it has already approved at its own (from) level:
//      same club (internal)   → accepted immediately (finalize)
//      different club (external) → straight to the destination club (clubB)
//  - A TEAM that creates it must first get its own club's approval.
export const initialTransferStatus = ({ callerIsClub, sameClub }) => {
    if (callerIsClub) return sameClub ? "accepted" : "waiting_club_to";
    return "waiting_club_from";
};

// Given the current status and an approver's decision, return the next status
// and whether this decision FINALIZES the move (player actually changes team).
// `sameClub` = the from-club and to-club are the same (internal move).
export const transferTransition = (currentStatus, decision, sameClub) => {
    if (decision === "rejected") return { status: "rejected", finalize: false };
    if (decision !== "accepted") return { status: currentStatus, finalize: false };

    switch (currentStatus) {
        case "waiting_club_from":
            // The player's own club approved. Internal moves are done; external
            // moves still need the destination club.
            return sameClub
                ? { status: "accepted", finalize: true }
                : { status: "waiting_club_to", finalize: false };
        case "waiting_club_to":
            // The destination club approved → the move is final.
            return { status: "accepted", finalize: true };
        case "waiting":
            // Legacy single-stage rows: an accept finalizes.
            return { status: "accepted", finalize: true };
        default:
            // Already accepted/rejected — no-op.
            return { status: currentStatus, finalize: false };
    }
};

// Which club (if any) is the current approver for a row — used to gate the
// قبول/رفض buttons to the right club. Returns "from" | "to" | null.
export const pendingApprover = (status) => {
    if (status === "waiting_club_from") return "from";
    if (status === "waiting_club_to") return "to";
    if (status === "waiting") return "to"; // legacy rows were approved by the receiver
    return null;
};

// Who gets to say which team the player lands in.
//
// The receiving club picks it, not the one letting the player go: the sending
// club has no business placing a player inside someone else's squad, and with
// team names repeating across clubs it could not pick correctly even in good
// faith. So a team id offered with an approval counts only when that team
// belongs to the destination club — otherwise the stored one stands.
//
// Rows created before clubs were recorded carry no destination club; there the
// caller's own club is the yardstick, and a caller with no club (super-admin)
// is trusted.
//
// @returns {string|null} the team the move should land in
export const resolveDestinationTeam = ({
    storedTeamId = null,
    requestedTeamId = null,
    requestedTeamClubId = null,
    destinationClubId = null,
    callerClubId = null,
} = {}) => {
    if (!requestedTeamId) return storedTeamId;

    const yardstick = destinationClubId || callerClubId;
    if (!yardstick) return requestedTeamId;            // nothing to check against
    if (!requestedTeamClubId) return storedTeamId;     // unknown team → keep what we had

    return requestedTeamClubId === yardstick ? requestedTeamId : storedTeamId;
};
