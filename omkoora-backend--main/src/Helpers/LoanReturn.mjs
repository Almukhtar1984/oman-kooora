import { Op } from 'sequelize';
import { ParticipatingTeams, ParticipatingPlayers } from '../Models/index.mjs';

/**
 * Remove a player's league-squad enrolment(s) that belong to ONE specific
 * team's participations — the team a loan is being returned FROM.
 *
 * A loan return restores players.id_team but, before this helper existed,
 * left the player enrolled in the receiving team's league squad
 * (ParticipatingPlayers is read by id_participating_team, not by the player's
 * current id_team, so the row lingered in the league dashboard).
 *
 * Scope is strictly the receiving team (idTeamTo): the player's enrolments
 * with any OTHER team — e.g. his original/lending team — are left untouched.
 *
 * ParticipatingPlayers is paranoid, so this is a SOFT delete: the row drops
 * out of league listings while any real match history it references
 * (ParticipatingPlayersMatch / ScorerMatch) stays on disk. Always call this
 * inside a transaction so the whole loan return commits atomically.
 *
 * @param {string} idPlayer     players.id being returned
 * @param {string} idTeamTo     the receiving team's teams.id (transfer.id_team_to)
 * @param {object} transaction  the enclosing Sequelize transaction
 * @returns {Promise<number>}   number of enrolment rows removed
 */
export async function removeReceivingTeamParticipations(idPlayer, idTeamTo, transaction) {
    // Every participation (league enrolment) owned by the receiving team.
    const receivingTeams = await ParticipatingTeams.findAll({
        where: { id_team: idTeamTo },
        attributes: ['id'],
        transaction
    });

    const participatingTeamIds = receivingTeams.map((pt) => pt.id);

    // A player who was never enrolled in any of the receiving team's leagues
    // returns cleanly with nothing to remove.
    if (participatingTeamIds.length === 0) return 0;

    return ParticipatingPlayers.destroy({
        where: {
            id_player: idPlayer,
            id_participating_team: { [Op.in]: participatingTeamIds }
        },
        transaction
    });
}
