import { ApolloError } from 'apollo-server-express';
import { v4 as UUID } from "uuid";
import { Sanction, Players as Player } from '../../Models/index.mjs';
import logger from "../../Config/logger.mjs";
import {CreateNotificationTeam} from "../../Helpers/index.mjs"
export const resolvers = {
    Query: {
        sanction: async (obj, { id }, context, info) => {
            try {
                return await Sanction.findByPk(id);
            } catch (error) {
                logger.error("Error fetching sanction by ID", error);
                throw new ApolloError(error);
            }
        },
        allSanctions: async (obj, { id_player }, context, info) => {
           // Send a notification when this query is called
           //CreateNotificationTeam("sanction","create","6b38b207-61b6-495d-8090-1bad345ad2d0","player")
           
           
            try {
                return await Sanction.findAll({
                    where: {
                        id_player: id_player
                    }
                });
            } catch (error) {
                logger.error("Error fetching all sanctions for player", error);
                throw new ApolloError(error);
            }
        },
        allSanctionsTeam: async (obj, { idTeam }, context, info) => {
            try {
                return await Sanction.findAll({
                    where: {
                        id_team: idTeam
                    }
                });
            } catch (error) {
                logger.error("Error fetching all sanctions for team", error);
                throw new ApolloError(error);
            }
        },
        allSanctionsClub: async (obj, { idClub }, context, info) => {
            try {
                return await Sanction.findAll({
                    where: {
                        id_club: idClub
                    }
                });
            } catch (error) {
                logger.error("Error fetching all sanctions for club", error);
                throw new ApolloError(error);
            }
        },
        getAllSanctionsByPlayer: async (obj, { id_player }, context, info) => {
            try {
                const sanctions = await Sanction.findAll({
                    where: { id_player },
                    paranoid: false 
                });
                return sanctions;
            } catch (error) {
                logger.error("Error retrieving sanctions for player", error);
                throw new ApolloError(error);
            }
        },
        SanctionLast: async (obj, { id_player }, context, info) => {
            try {
                return await Sanction.findOne({
                    where: { id_player },
                    order: [['createdAt', 'DESC']] // Order by creation date, descending
                });
            } catch (error) {
                logger.error("Error retrieving last sanction for player", error);
                throw new ApolloError(error);
            }
        }
    },
    Sanction: {
        player: async ({ id_player }, {}, context, info) => {
            try {
                return await Player.findByPk(id_player);
            } catch (error) {
                logger.error("Error fetching player by ID", error);
                throw new ApolloError(error);
            }
        }
    },
    Mutation: {
        createSanction: async (obj, { content }, context, info) => {
         
            try {
                let sanction = await Sanction.create({ ...content });
                let player = await Player.findByPk(content.id_player);
                
                if (player) {
                    await player.update({ status: "suspended" });

                    CreateNotificationTeam("sanction","create",player.id_team,player.id)
                }
                return sanction;
            } catch (error) {
                logger.error("Error creating sanction", error);
                throw new ApolloError(error);
            }
        },
        updateSanction: async (obj, { id, content }, context, info) => {
            try {
             
                let result = await Sanction.update({ ...content }, { where: { id } });
                console.error(result)
                return {
                    status: result[0] === 1
                };
            } catch (error) {
                logger.error("Error updating sanction", error);
                throw new ApolloError(error);
            }
        },
        deleteSanction: async (obj, { id }, context, info) => {
            try {
                // Find the sanction to get the player ID
                const sanction = await Sanction.findByPk(id);
                if (!sanction) {
                    throw new ApolloError(`Sanction with id ${id} does not exist.`);
                }
             
                // Delete the sanction
                const result = await Sanction.destroy({ where: { id } });

                if (result === 1) {
                    // Update player status to "accepted" if the sanction was deleted
                    let player = await Player.findByPk(sanction.id_player);
                    if (player) {
                        await player.update({ status: "accepted" });
                        CreateNotificationTeam("sanction","delete",player.id_team,player.id)
                       
                    }
                    
                 }

                
               

                 return {
                    status: result === 1
                };
            } catch (error) {
                logger.error("Error deleting sanction", error);
                throw new ApolloError(error);
            }
        }
    }
};
