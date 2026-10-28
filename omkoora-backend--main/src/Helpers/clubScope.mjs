// Which club the caller may write to, and whether a team really belongs to it.
//
// Team names repeat across clubs on purpose — "فريق الجزيرة" exists in three
// clubs, "فريق الاتحاد" in four — and nothing in the request carries the club,
// only an id the client picked from a list of names. One wrong pick registers a
// player into another club's identically-named team, and the mistake is
// invisible afterwards: the card shows the right team name under the wrong club,
// and the club that actually has the player cannot touch the record.
//
// So the server decides, instead of trusting the id it was handed.

import { Club, ClubManagement, Members, Team } from "../Models/index.mjs";

const CLUB_ADMIN_ROLE = "2";
const TEAM_ADMIN_ROLE = "3";

/**
 * Does this team belong to someone else's club?
 *
 * Kept pure so the rule can be tested without a database: a caller with no club
 * of their own (super-admin, league admin) is never blocked, and a team whose
 * club is unknown is not blocked either — a missing row must not turn into a
 * refusal of legitimate work.
 */
export const isForeignTeam = (callerClubId, teamClubId) =>
    Boolean(callerClubId && teamClubId && callerClubId !== teamClubId);

/** The club a club admin (role 2) or a team account (role 3) acts for. */
export const callerClubId = async (context) => {
    const user = context?.user;
    if (!context?.isAuth || !user) return null;

    if (user.role === CLUB_ADMIN_ROLE) {
        const mgmt = await ClubManagement.findOne({ where: { id_person: user.id_person } });
        return mgmt?.id_club || null;
    }

    if (user.role === TEAM_ADMIN_ROLE) {
        // A team account is the User of a person sitting in that team's member
        // list (the manager row created with the team).
        const member = await Members.findOne({ where: { id_person: user.id_person } });
        if (!member?.id_team) return null;
        const team = await Team.findByPk(member.id_team);
        return team?.id_club || null;
    }

    return null;
};

/** The club a team belongs to, or null when the team is unknown. */
export const clubOfTeam = async (idTeam) => {
    if (!idTeam) return null;
    const team = await Team.findByPk(idTeam);
    return team?.id_club || null;
};

/**
 * Refuse a write that would put someone into another club's team.
 *
 * @throws {Error} with code TEAM_NOT_IN_CLUB — the message names the club the
 *                 team really belongs to, because the whole point is that the
 *                 two teams look identical by name.
 */
export const assertTeamInCallerClub = async (context, idTeam) => {
    if (!idTeam) return;

    const [mine, teamClub] = await Promise.all([
        callerClubId(context),
        clubOfTeam(idTeam),
    ]);

    if (!isForeignTeam(mine, teamClub)) return;

    const team = await Team.findByPk(idTeam, { include: [{ model: Club, as: "club", attributes: ["name"] }] });
    const clubName = team?.club?.name || "نادٍ آخر";
    const error = new Error(
        `الفريق المختار (${team?.name || "غير معروف"}) تابع لـ${clubName} وليس لناديك — ` +
        `أسماء الفرق تتكرر بين الأندية، فتأكد من اختيار فريق ناديك.`
    );
    error.code = "TEAM_NOT_IN_CLUB";
    throw error;
};

/**
 * فريق المستدعي حين يكون حساب فريق (دور ٣) — وإلا فلا فريق له.
 *
 * الفريق لا يدفع عن غيره ولا يحرّك طلب غيره، فهذه هي الحدّ الذي يُقاس عليه.
 */
export const callerTeamId = async (context) => {
    const user = context?.user;
    if (!context?.isAuth || user?.role !== TEAM_ADMIN_ROLE || !user?.id_person) return null;
    const member = await Members.findOne({ where: { id_person: user.id_person } });
    return member?.id_team || null;
};
