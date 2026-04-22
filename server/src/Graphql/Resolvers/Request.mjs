import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Request, Players, Team} from '../../Models/index.mjs';
import {assertCanAccessPlayer, assertCanAccessTeam} from "../../Helpers/Authorization.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        request: async (obj, {id}, context, info) =>  {
            try {
                const request = await Request.findByPk(id)
                await assertCanAccessPlayer(context, request?.id_player);

                return request
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allRequests: async (obj, {idPlayer, type}, context, info) =>  {
            try {
                await assertCanAccessPlayer(context, idPlayer);

                return await Request.findAll({
                    where: {
                        id_player: idPlayer,
                        type
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allRequestsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                await assertCanAccessTeam(context, idTeam);

                return await Request.findAll({
                    include: {
                        model: Players,
                        as: "player",
                        required: true,
                        right: true,
                        where: {
                            id_team: idTeam
                        }
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Request: {
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
        createRequest: async (obj, {content}, context, info) =>  {
            try {
                await assertCanAccessPlayer(context, content.id_player);

                return await Request.create(content)
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateRequest: async (obj, {id, content}, context, info) =>  {
            try {
                const request = await Request.findByPk(id);
                if (!request) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessPlayer(context, request.id_player);
                await assertCanAccessPlayer(context, content.id_player);

                let result = await Request.update(content, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteRequest: async (obj, {id}, context, info) =>  {
            try {
                const request = await Request.findByPk(id);
                if (!request) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessPlayer(context, request.id_player);

                const team = await Request.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                // logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
