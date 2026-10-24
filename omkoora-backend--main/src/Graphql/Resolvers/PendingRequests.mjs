import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';

import logger from "../../Config/logger.mjs";
import { Blog, Members, Players, PlayerRelease, Team, TechnicalApparatus, Transfer } from '../../Models/index.mjs';
import { callerClubId } from "../../Helpers/clubScope.mjs";
import { summarizePending } from "../../Helpers/pendingRequests.mjs";

const { Op } = sequelize;

// A registration the club has not decided yet, whichever stage it sits at.
const UNDECIDED = ["waiting", "waiting_club"];
const TRANSFER_UNDECIDED = ["waiting", "waiting_club_from", "waiting_club_to"];

export const resolvers = {
    Query: {
        clubPendingRequests: async (obj, args, context) => {
            try {
                const idClub = await callerClubId(context);
                if (!idClub) return { total: 0, groups: [] };

                const teams = await Team.findAll({ where: { id_club: idClub }, attributes: ["id"] });
                const teamIds = teams.map((team) => team.id);
                const byTeam = { id_team: { [Op.in]: teamIds }, status: { [Op.in]: UNDECIDED } };

                // Counted in parallel: this runs behind a badge on every page.
                const [players, technicals, members, transfers, loans, releases, news] = await Promise.all([
                    teamIds.length ? Players.count({ where: byTeam }) : 0,
                    teamIds.length ? TechnicalApparatus.count({ where: byTeam }) : 0,
                    teamIds.length ? Members.count({ where: byTeam }) : 0,
                    Transfer.count({
                        where: {
                            transition_type: "transition",
                            status: { [Op.in]: TRANSFER_UNDECIDED },
                            [Op.or]: [{ id_club_from: idClub }, { id_club_to: idClub }],
                        },
                    }),
                    Transfer.count({
                        where: {
                            transition_type: "loan",
                            status: { [Op.in]: TRANSFER_UNDECIDED },
                            [Op.or]: [{ id_club_from: idClub }, { id_club_to: idClub }],
                        },
                    }),
                    PlayerRelease.count({ where: { id_club: idClub, status: "waiting" } }),
                    Blog.count({ where: { id_club: idClub, status: "waiting" } }),
                ]);

                return summarizePending({ players, technicals, members, transfers, loans, releases, news });
            } catch (error) {
                logger.error(`PendingRequests.clubPendingRequests: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },
};
