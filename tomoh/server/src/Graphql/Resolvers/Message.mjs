import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Club, Team, Message, Attachment, Comment} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        message: async (obj, {id}, context, info) =>  {
            try {
                return await Message.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allMessage: async (obj, {idClub}, context, info) =>  {
            try {
                return await Message.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allMessageClubSender: async (obj, {idClub}, context, info) =>  {
            try {
                return await Message.findAll({
                    where: {
                        id_club_sender: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        allMessageClubReceiver: async (obj, {idClub}, context, info) =>  {
            try {
                return await Message.findAll({
                    where: {
                        [Op.and]: [
                            {"$team.id_club$": idClub},
                            {id_team_receiver: null}
                        ]
                    },
                    include: {
                        model: Team,
                        as: "team",
                        right: true,
                        required: true,
                        on: {
                            id: {[Op.eq]: col("id_team_sender")}
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allMessageTeamSender: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Message.findAll({
                    where: {
                        id_team_sender: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        allMessageTeamReceiver: async (obj, {idTeam}, context, info) =>  {
            try {
                const message = await Message.findAll({
                    where: {
                        [Op.or]: [
                            {[Op.and]: [
                                {"$club->team.id$": idTeam},
                                {id_team_receiver: idTeam}
                            ]},
                            {[Op.and]: [
                                {"$club->team.id$": idTeam},
                                {id_team_receiver: null}
                            ]}
                        ]
                    },
                    include: {
                        model: Club,
                        as: "club",
                        right: true,
                        required: true,
                        on: {
                            id: {[Op.eq]: col("id_club_sender")}
                        },
                        include: {
                            model: Team,
                            as: "team",
                            right: true,
                            required: true
                        }
                    }
                })

                return message
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Message: {
        club_sender: async ({id_club_sender}, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id_club_sender)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        club_receiver: async ({id_club_receiver}, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id_club_receiver)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        team_sender: async ({id_team_sender}, {id}, context, info) =>  {
            try {
                return await Team.findByPk(id_team_sender)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        team_receiver: async ({id_team_receiver}, {id}, context, info) =>  {
            try {
                return await Team.findByPk(id_team_receiver)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        attachment: async ({id}, {}, context, info) =>  {
            try {
                return await Attachment.findAll({
                    where: {
                        id_message: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        comment: async ({id}, {}, context, info) =>  {
            try {
                return await Comment.findAll({
                    where: {
                        id_message: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },
    Comment: {
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
        },
    },


    Mutation: {
        createMessage: async (obj, {content}, context, info) =>  {
            try {
                const logo = await content.logo;
                const attachment = await content.attachment;

                let message = await Message.create({
                    subject:            content.subject,
                    content:            content.content,
                    priority:           content.priority,
                    id_club_sender:     content.id_club_sender !== "" ? content.id_club_sender : null,
                    id_team_sender:     content.id_team_sender !== "" ? content.id_team_sender : null,
                    id_team_receiver:   content.id_team_receiver !== "" ? content.id_team_receiver : null,
                })

                if (message && logo) {
                    const listType = ["JPEG", "JPG", "PNG"]

                    const { createReadStream, filename, mimetype, encoding } = logo;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    const imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Message.update({logo: imgUniqName}, { where: { id: message.id } })
                }

                if (message && attachment && attachment.length > 0) {
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

                        await Attachment.create({content: imgUniqName, id_message: message.id})
                    }
                }

                return message
            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateMessage: async (obj, {id, content}, context, info) =>  {
            try {
                let result = await Message.update({
                    subject:            content.subject,
                    content:            content.content,
                    priority:           content.priority,
                    id_club_sender:     content.id_club_sender,
                    id_team_sender:     content.id_team_sender,
                    id_team_receiver:   content.id_team_receiver
                }, { where: { id } })


                if (content && "logo" in content && content.logo) {
                    const listType = ["JPEG", "JPG", "PNG"]

                    const { createReadStream, filename, mimetype, encoding } = await content.logo;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    const imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Message.update({logo: imgUniqName}, { where: { id } })
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteMessage: async (obj, {id}, context, info) =>  {
            try {
                const message = await Message.destroy({ where: { id } })

                return {
                    status: message === 1
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
