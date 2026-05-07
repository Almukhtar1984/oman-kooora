import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Permission, User,Person} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        permission: async (obj, {id}, context, info) =>  {
            try {
                return await Permission.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPermissionsClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Permission.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPermissionsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Permission.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Permission: {
        user: async ({id_user}, {id}, context, info) =>  {
            try {
                return await User.findByPk(id_user)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },


    Mutation: {
        createPermission: async (obj, {content}, context, info) =>  {
            try {
                // The @auth directive on this mutation is currently commented
                // out in Schemas/Permission.mjs, so enforce auth + a tier check
                // inline. Without these guards any anonymous caller could grant
                // arbitrary permissions to any user (including a super-admin).
                const { user, isAuth } = context;
                if (!isAuth || !user) {
                    return new AuthenticationError("Authentication required");
                }
                if (user.role !== "1" && user.role !== "2") {
                    return new ForbiddenError("Only admins can manage permissions");
                }
                if (!content?.id_user) {
                    return new ApolloError("id_user is required", "BAD_USER_INPUT");
                }
                const targetUser = await User.findByPk(content.id_user);
                if (!targetUser) {
                    return new ApolloError("Target user not found", "USER_NOT_EXIST");
                }
                if (targetUser.role === "1") {
                    return new ForbiddenError("Cannot manage super-admin permissions");
                }

                return await Permission.create({
                    teams: (content.teams || []).join(','),
                    members: (content.members || []).join(','),
                    technicals: (content.technicals || []).join(','),
                    players: (content.players || []).join(','),
                    transfer_players: (content.transfer_players || []).join(','),
                    loan_players: (content.loan_players || []).join(','),
                    assembly: (content.assembly || []).join(','),
                    inbox: (content.inbox || []).join(','),
                    outbox: (content.outbox || []).join(','),
                    meeting: (content.meeting || []).join(','),
                    blogs: (content.blogs || []).join(','),
                    forms: (content.forms || []).join(','),
                    permissions: (content.permissions || []).join(','),
                    complaints: (content.complaints || []).join(','),
                    expenses: (content.expenses || []).join(','),

                    id_user:   content.id_user
                })
            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updatePermission: async (obj, {id, content}, context, info) =>  {
            try {
                const { user, isAuth } = context;
                if (!isAuth || !user) {
                    return new AuthenticationError("Authentication required");
                }
                if (user.role !== "1" && user.role !== "2") {
                    return new ForbiddenError("Only admins can manage permissions");
                }
                const existing = await Permission.findByPk(id);
                if (!existing) {
                    return new ApolloError("Permission not found", "PERMISSION_NOT_FOUND");
                }
                const targetUser = await User.findByPk(existing.id_user);
                if (targetUser && targetUser.role === "1") {
                    return new ForbiddenError("Cannot manage super-admin permissions");
                }

                let result = await Permission.update({
                    teams: (content.teams || []).join(','),
                    members: (content.members || []).join(','),
                    technicals: (content.technicals || []).join(','),
                    players: (content.players || []).join(','),
                    transfer_players: (content.transfer_players || []).join(','),
                    loan_players: (content.loan_players || []).join(','),
                    assembly: (content.assembly || []).join(','),
                    inbox: (content.inbox || []).join(','),
                    outbox: (content.outbox || []).join(','),
                    meeting: (content.meeting || []).join(','),
                    blogs: (content.blogs || []).join(','),
                    forms: (content.forms || []).join(','),
                    permissions: (content.permissions || []).join(','),
                    complaints: (content.complaints || []).join(','),
                    expenses: (content.expenses || []).join(','),
                }, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deletePermission: async (obj, {id}, context, info) =>  {
            console.log("id:",id)
            try {
                const Power = await Permission.findByPk(id)
                //const expense = await Permission.destroy({ where: { id } })
                const person = await Person.findByPk(id)
                console.log("Power",Power)
                console.log("person",person)
                return {
                    //status: expense === 1
                    status: true
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
