// What a team may still change about its own people after the club has approved
// them.
//
// Approval is the club's signature on a registration: this player, these
// details, this team. A team that can still edit, delete or release an approved
// member afterwards makes that signature worthless — the card the club approved
// and the card in the system stop being the same thing, and nobody notices.
//
// So after approval the team can only read. The club (role 2) and the owner
// (role 1) keep every power they had; nothing changes for them.
//
// Pure decisions only — no DB, no IO.

const TEAM_ADMIN_ROLE = "3";
const APPROVED = "accepted";

/**
 * Is this record out of the caller's hands?
 *
 * @param {string|undefined} role    the caller's role
 * @param {string|undefined} status  the record's status
 */
export const isLockedForCaller = (role, status) =>
    role === TEAM_ADMIN_ROLE && status === APPROVED;

/** The refusal the team should read — it says who to go to, not just "no". */
export const LOCKED_MESSAGE =
    "هذا السجل معتمد من النادي — التعديل أو الحذف أو التحرير بعد الاعتماد من صلاحية النادي";

export const LOCKED_CODE = "APPROVED_RECORD_LOCKED";
