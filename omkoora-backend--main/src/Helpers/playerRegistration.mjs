// What to do when the civil number typed into "إضافة لاعب" already belongs to
// someone in the database.
//
// It used to be one blunt rule: any existing card number -> CARD_NUMBER_ALREADY_EXISTS.
// That dead-ended two legitimate cases the clubs hit every week:
//   * the person is in the system (board member, assembly, an old record…) but is
//     not a player at all, and
//   * the person has a player record that hangs on no team,
// and in both the club was told "مسجّل سابقاً" with no way forward.
//
// Only a player who is actually on a team is a real duplicate: moving them is a
// transfer, not a registration.

export const DUPLICATE = "duplicate";   // already a player on a team → refuse
export const ATTACH = "attach";         // player exists with no team → put them on this one
export const REUSE_PERSON = "reuse";    // person exists but is not a player → create the player for them
export const PHONE_TAKEN = "phone";     // the phone belongs to a different person

/**
 * @param {object|null} person  the Person row matching the card number or phone
 * @param {object|null} player  that person's Players row, when they have one
 * @param {object} input        { card_number, phone } as typed in the form
 * @returns {null|{action: string, reason?: string}}  null = nothing in the way
 */
export const classifyExistingPerson = (person, player, input = {}) => {
    if (!person) return null;

    const typedCard = String(input.card_number ?? "").trim();
    const typedPhone = String(input.phone ?? "").trim();
    const personCard = String(person.card_number ?? "").trim();
    const personPhone = String(person.phone ?? "").trim();

    // Matched on the phone only: that number is someone else's.
    if (!(typedCard && personCard && typedCard === personCard)) {
        if (typedPhone && personPhone && typedPhone === personPhone) {
            return { action: PHONE_TAKEN };
        }
        return null;
    }

    // Same civil number → same human being.
    if (!player) return { action: REUSE_PERSON };
    if (player.id_team) return { action: DUPLICATE, reason: "already on a team" };
    return { action: ATTACH };
};
