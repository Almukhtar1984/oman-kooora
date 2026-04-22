import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Permission, User} from '../../Models/index.mjs';
import {assertCanAccessClub, assertCanAccessTeam, assertCanAccessUserScope} from "../../Helpers/Authorization.mjs";
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        permission: async (obj, {id}, context, info) =>  {
            try {
                const permission = await Permission.findByPk(id)
                await assertCanAccessUserScope(context, permission?.id_user);

                return permission
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPermissionsClub: async (obj, {idClub}, context, info) =>  {
            try {
                await assertCanAccessClub(context, idClub);

                return await Permission.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPermissionsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                await assertCanAccessTeam(context, idTeam);

                return await Permission.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
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
                await assertCanAccessUserScope(context, content.id_user);

                return await Permission.create({
                    teams:      content.teams.join(','),
                    members:      content.members.join(','),
                    technicals:      content.technicals.join(','),
                    players:      content.players.join(','),
                    transfer_players:      content.transfer_players.join(','),
                    loan_players:      content.loan_players.join(','),
                    assembly:      content.assembly.join(','),
                    inbox:      content.inbox.join(','),
                    outbox:      content.outbox.join(','),
                    meeting:      content.meeting.join(','),
                    blogs:      content.blogs.join(','),
                    forms:      content.forms.join(','),
                    permissions:      content.permissions.join(','),

                    complaints:      content.complaints.join(','),
                    expenses:      content.expenses.join(','),
            
                    id_user:   content.id_user
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updatePermission: async (obj, {id, content}, context, info) =>  {
            try {
                const permission = await Permission.findByPk(id);
                if (!permission) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessUserScope(context, permission.id_user);
                await assertCanAccessUserScope(context, content.id_user);

                let result = await Permission.update({
                    teams:      content.teams.join(','),
                    members:      content.members.join(','),
                    technicals:      content.technicals.join(','),
                    players:      content.players.join(','),
                    transfer_players:      content.transfer_players.join(','),
                    loan_players:      content.loan_players.join(','),
                    assembly:      content.assembly.join(','),
                    inbox:      content.inbox.join(','),
                    outbox:      content.outbox.join(','),
                    meeting:      content.meeting.join(','),
                    blogs:      content.blogs.join(','),
                    forms:      content.forms.join(','),
                    permissions:      content.permissions.join(','),

                    complaints:      content.complaints.join(','),
                    expenses:      content.expenses.join(','),
                }, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deletePermission: async (obj, {id}, context, info) =>  {
            try {
                const permission = await Permission.findByPk(id);
                if (!permission) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessUserScope(context, permission.id_user);

                const expense = await Permission.destroy({ where: { id } })

                return {
                    status: expense === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
