import { ApolloError, AuthenticationError } from 'apollo-server-express';

import { ClubManagement, Members, Players, Team, User } from '../Models/index.mjs';

const SUPER_ADMIN_ROLES = new Set([
    "1",
    "admin",
    "super-admin",
    "super_admin",
    "superadmin"
]);

const normalizeRole = (role) => `${role || ""}`.trim().toLowerCase().replace(/\s+/g, "_");
const normalizeId = (id) => `${id || ""}`.trim();
const hasId = (id) => normalizeId(id) !== "";

export const assertAuthenticated = ({isAuth, user}) => {
    if (!isAuth || !user) {
        throw new AuthenticationError("You must be the authenticated user to get this information");
    }
}

export const isSuperAdmin = (user) => SUPER_ADMIN_ROLES.has(normalizeRole(user?.role));

export const assertSuperAdmin = (context) => {
    assertAuthenticated(context);

    if (!isSuperAdmin(context.user)) {
        throw new ApolloError("You do not have permission to manage this resource", "FORBIDDEN");
    }
}

export const getUserAccessScope = async (user) => {
    if (isSuperAdmin(user)) {
        return {
            all: true,
            clubIds: new Set(),
            teamIds: new Set()
        };
    }

    const clubManagement = await ClubManagement.findAll({
        where: {
            id_person: user.id_person
        }
    });

    const members = await Members.findAll({
        where: {
            id_person: user.id_person
        },
        include: {
            model: Team,
            as: "team",
            required: false
        }
    });

    const clubIds = new Set();
    const teamIds = new Set();

    clubManagement.forEach((item) => {
        if (item.id_club) clubIds.add(normalizeId(item.id_club));
    });

    members.forEach((item) => {
        if (item.id_team) teamIds.add(normalizeId(item.id_team));
        if (item.team?.id_club) clubIds.add(normalizeId(item.team.id_club));
    });

    return {
        all: false,
        clubIds,
        teamIds
    };
}

export const assertCanAccessClub = async (context, idClub) => {
    if (!hasId(idClub)) return;

    assertAuthenticated(context);

    const scope = await getUserAccessScope(context.user);
    if (scope.all || scope.clubIds.has(normalizeId(idClub))) return;

    throw new ApolloError("You do not have permission to access this club", "FORBIDDEN");
}

export const assertCanAccessTeam = async (context, idTeam) => {
    if (!hasId(idTeam)) return;

    assertAuthenticated(context);

    const scope = await getUserAccessScope(context.user);
    if (scope.all || scope.teamIds.has(normalizeId(idTeam))) return;

    const team = await Team.findByPk(idTeam);
    if (team?.id_club && scope.clubIds.has(normalizeId(team.id_club))) return;

    throw new ApolloError("You do not have permission to access this team", "FORBIDDEN");
}

export const assertCanAccessAnyScope = async (context, {clubIds = [], teamIds = []}) => {
    assertAuthenticated(context);

    const scope = await getUserAccessScope(context.user);
    if (scope.all) return;

    const normalizedClubIds = clubIds.map(normalizeId).filter(Boolean);
    const normalizedTeamIds = teamIds.map(normalizeId).filter(Boolean);

    if (normalizedClubIds.length === 0 && normalizedTeamIds.length === 0) return;

    if (normalizedClubIds.some((id) => scope.clubIds.has(id))) return;
    if (normalizedTeamIds.some((id) => scope.teamIds.has(id))) return;

    for (const idTeam of normalizedTeamIds) {
        const team = await Team.findByPk(idTeam);
        if (team?.id_club && scope.clubIds.has(normalizeId(team.id_club))) return;
    }

    throw new ApolloError("You do not have permission to access this record", "FORBIDDEN");
}

export const assertCanAccessRecordScope = async (context, record) => {
    if (!record) return;

    await assertCanAccessClub(context, record.id_club);
    await assertCanAccessTeam(context, record.id_team);
}

export const assertCanAccessPlayer = async (context, idPlayer) => {
    if (!hasId(idPlayer)) return null;

    const player = await Players.findByPk(idPlayer);
    if (!player) return null;

    await assertCanAccessTeam(context, player.id_team);

    return player;
}

export const assertCanAccessUserScope = async (context, idUser) => {
    if (!hasId(idUser)) return;

    assertAuthenticated(context);

    if (normalizeId(context.user.id) === normalizeId(idUser)) return;

    const currentScope = await getUserAccessScope(context.user);
    if (currentScope.all) return;

    const targetUser = await User.findByPk(idUser);
    if (!targetUser || isSuperAdmin(targetUser)) {
        throw new ApolloError("You do not have permission to access this user", "FORBIDDEN");
    }

    const targetScope = await getUserAccessScope(targetUser);

    for (const idClub of targetScope.clubIds) {
        if (currentScope.clubIds.has(idClub)) return;
    }

    for (const idTeam of targetScope.teamIds) {
        if (currentScope.teamIds.has(idTeam)) return;
    }

    throw new ApolloError("You do not have permission to access this user", "FORBIDDEN");
}
