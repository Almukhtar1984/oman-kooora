import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Transfer, Players, Team, Club} from '../../Models/index.mjs';


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        transfer: async (obj, {id}, context, info) =>  {
            try {
                return await Transfer.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTransfer: async (obj, {idClub}, context, info) =>  {
            try {
                return await Transfer.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTransferTeam: async (obj, {idTeam, transitionType}, context, info) =>  {
            try {
                return await Transfer.findAll({
                    where: {
                        [Op.or]: [
                            {id_team_to: idTeam},
                            {id_team_from: idTeam}
                        ],
                        transition_type: {
                            [Op.in]: transitionType
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTransferClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Transfer.findAll({
                    where: {
                        [Op.or]: [
                            {id_club_to: idClub},
                            {"$team.id_club$": idClub}
                        ]
                    },
                    include: {
                        model: Team,
                        as: "team",
                        required: true,
                        right: true,
                        on: {
                            [Op.or]: [
                                {id: {[Op.eq]: col("id_team_from")}},
                                {id: {[Op.eq]: col("id_team_to")}}
                            ]
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Transfer: {
        team_from: async ({id_team_from}, {id}, context, info) =>  {
            try {
                return await Team.findByPk(id_team_from)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        team_to: async ({id_team_to}, {id}, context, info) =>  {
            try {
                return await Team.findByPk(id_team_to)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        club_to: async ({id_club_to}, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id_club_to)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        player: async ({id_player}, {id}, context, info) =>  {
            try {
                return await Players.findByPk(id_player)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Mutation: {
        createTransfer: async (obj, {content}, context, info) =>  {
            try {
                let transfer = await Transfer.create(content)

                if (content.status === "accepted") {
                    await Players.update({id_team: content.id_team_to}, { where: { id: content.id_player } })
                } else if (transfer && content.id_player) {
                    await Players.update({status: "waiting"}, { where: { id: content.id_player } })
                }

                return transfer
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateTransfer: async (obj, {id, content}, context, info) =>  {
            try {
                let result = await Transfer.update({status: content.status}, { where: { id } })


                if (result[0] === 1) {
                    if (content.status === "accepted") {
                        await Transfer.update({id_team_to: content.id_team_to, id_club_to: null}, { where: { id } })

                        await Players.update({status: "accepted", id_team: content.id_team_to}, { where: { id: content.id_player } })
                    } else if (content.status === "rejected") {
                        await Players.update({status: "accepted"}, { where: { id: content.id_player } })
                    }
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteTransfer: async (obj, {id}, context, info) =>  {
            try {
                const team = await Transfer.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        BackToOldTeamTransfer: async (obj, { id }, context, info) => {
            try {
                // Fetch the transfer record
                const transfer = await Transfer.findByPk(id);
                if (!transfer) {
                    throw new ApolloError(`Transfer with ID ${id} not found`);
                }

                // Update player's team to the old team
                const updatedPlayer = await Players.update(
                    { id_team: transfer.id_team_from },
                    { where: { id: transfer.id_player } }
                );

                if (updatedPlayer[0] === 0) {
                    throw new ApolloError(`Failed to update player team for player ID ${transfer.id_player}`);
                }

                // Delete the transfer record
                const deleted = await Transfer.destroy({ where: { id } });
                if (deleted === 0) {
                    throw new ApolloError(`Failed to delete transfer with ID ${id}`);
                }

                return {
                    status: deleted === 1 // Return true if deletion was successful
                };
            } catch (error) {
                logger.error(`Error in BackToOldTeamTransfer resolver: ${error.message}`);
                throw new ApolloError(error.message || 'An error occurred while processing the request');
            }
        },
        updateLoan: async (obj, { id, date_start, date_end }, context, info) => {
            try {
                const [updated] = await Transfer.update(
                    { date_start, date_end }, // Fields to update
                    { where: { id } } // Update condition
                );
        
                return {
                    status: updated === 1 // Check if exactly one record was updated
                };
            } catch (error) {
                // Log error or handle it as needed
                throw new ApolloError(error.message || "Failed to update loan");
            }
        },
        

    }
}
