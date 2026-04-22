import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Club, Team, Expense, Attachment, Comment} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        expense: async (obj, {id}, context, info) =>  {
            try {
                return await Expense.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allExpensesClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Expense.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allExpensesTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Expense.findAll({
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

    Expense: {
        team: async ({id_team}, {id}, context, info) =>  {
            try {
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        club: async ({id_club}, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },


    Mutation: {
        createExpense: async (obj, {content}, context, info) =>  {
            try {
                const attachment = await content.attachment

                if (attachment) {
                    const { createReadStream, filename, mimetype, encoding } = attachment;
                    const listType = ["JPEG", "JPG", "PNG", "PDF"]

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    return await Expense.create({...content, attachment: uniqName})
                }
                
                return await Expense.create(content)
            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateExpense: async (obj, {id, content}, context, info) =>  {
            try {
                const attachment = await content.attachment

                if (attachment) {
                    const { createReadStream, filename, mimetype, encoding } = attachment;
                    const listType = ["JPEG", "JPG", "PNG", "PDF"]

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    let result = await Expense.update({...content, attachment: uniqName}, { where: { id } })
                    
                    return {
                        status: result[0] === 1
                    }
                }

                let result = await Expense.update({ ...content }, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteExpense: async (obj, {id}, context, info) =>  {
            try {
                const expense = await Expense.destroy({ where: { id } })

                return {
                    status: expense === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },


        createComment: async (obj, {content}, context, info) =>  {
            try {
                let comment = await Comment.create(content)

                return comment
            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateComment: async (obj, {id, content}, context, info) =>  {
            try {
                let result = await Comment.update({...content}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteComment: async (obj, {id}, context, info) =>  {
            try {
                const comment = await Comment.destroy({ where: { id } })

                return {
                    status: comment === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
