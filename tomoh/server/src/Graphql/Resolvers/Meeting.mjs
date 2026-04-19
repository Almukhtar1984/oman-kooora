import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Club, Team, Meeting, Attachment} from '../../Models/index.mjs';
import {v4 as UUID} from "uuid";
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream} from "fs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        meeting: async (obj, {id}, context, info) =>  {
            try {
                return await Meeting.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allMeetingsClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Meeting.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allMeetingsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Meeting.findAll({
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

    Meeting: {
        team: async ({id_team}, {}, context, info) =>  {
            try {
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        club: async ({id_club}, {}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        attachment: async ({id}, {}, context, info) =>  {
            try {
                return await Attachment.findAll({
                    where: {
                        id_meeting: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },


    Mutation: {
        createMeeting: async (obj, {content}, context, info) =>  {
            try {
                const attachment = await content.attachment;

                let meeting = await Meeting.create({...content})

                if (meeting && attachment && attachment.length > 0) {
                    const listType = ["JPEG", "JPG", "PNG", "MP4", "PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "CSV", "ZIP"]

                    for (let i = 0; i < attachment.length; i++) {
                        const { createReadStream, filename, mimetype, encoding } = await attachment[i];

                        const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        const isImage = listType.indexOf(imgType) !== -1

                        if(!isImage) { return new ApolloError("This file is not image") }

                        const imgUniqName = `${UUID()}.${imgType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        await Attachment.create({content: imgUniqName, id_meeting: meeting.id})
                    }
                }

                return meeting
            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateMeeting: async (obj, {id, content}, context, info) =>  {
            try {
                const attachment = await content.attachment;

                let result = await Meeting.update({...content}, { where: { id } })

                if (attachment && attachment.length > 0) {
                    await Attachment.destroy({where: {id_meeting: id}})

                    const listType = ["JPEG", "JPG", "PNG", "MP4", "PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "CSV", "ZIP"]

                    for (let i = 0; i < attachment.length; i++) {
                        const { createReadStream, filename, mimetype, encoding } = await attachment[i];

                        const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        const isImage = listType.indexOf(imgType) !== -1

                        if(!isImage) { return new ApolloError("This file is not image") }

                        const imgUniqName = `${UUID()}.${imgType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        await Attachment.create({content: imgUniqName, id_meeting: id})
                    }
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteMeeting: async (obj, {id}, context, info) =>  {
            try {
                const meeting = await Meeting.destroy({ where: { id } })

                return {
                    status: meeting === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    }
}
