import { ApolloError } from 'apollo-server-express';
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
