// May this team account still work? — the database side of teamRegistration.mjs.
//
// Asked on every request a team account (role 3) makes, so the answer is kept
// for a short while instead of costing two queries each time. The club's own
// changes (updateTeam) clear it at once; the end of a period needs no clearing,
// because the date is compared afresh on every call.

import { Members, Team } from "../Models/index.mjs";
import { teamSuspension } from "./teamRegistration.mjs";

const TEAM_ROLE = "3";
const TTL_MS = 30 * 1000;
const cache = new Map();   // id_person → { team, at }

/** Forget every cached team — called whenever a club changes a team. */
export const forgetTeamAccess = () => cache.clear();

const teamOfPerson = async (idPerson) => {
    const hit = cache.get(idPerson);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.team;

    // A team account is the User of a person in that team's member list (the
    // manager row created with the team) — the same lookup as callerTeamId.
    const member = await Members.findOne({ where: { id_person: idPerson }, attributes: ["id_team"] });
    const row = member?.id_team
        ? await Team.findByPk(member.id_team, { attributes: ["id", "account_status", "registration_end"] })
        : null;
    const team = row ? { account_status: row.account_status, registration_end: row.registration_end } : null;
    cache.set(idPerson, { team, at: Date.now() });
    return team;
};

/**
 * Why this user's team account is stopped, or null. Only team accounts are
 * asked: a club or super-admin account is never stopped by a team's state.
 */
export const suspensionForUser = async (user) => {
    if (!user || String(user.role) !== TEAM_ROLE || !user.id_person) return null;
    return teamSuspension(await teamOfPerson(user.id_person));
};
