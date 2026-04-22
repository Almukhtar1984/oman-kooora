import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Club, Team, Blog, AttachmentBlog} from '../../Models/index.mjs';
import {assertCanAccessClub, assertCanAccessRecordScope, assertCanAccessTeam} from "../../Helpers/Authorization.mjs";
import {v4 as UUID} from "uuid";
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream} from "fs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        blog: async (obj, {id}, context, info) =>  {
            try {
                return await Blog.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allBlogs: async (obj, {}, context, info) =>  {
            try {
                return await Blog.findAll({
                    where: {
                        status: "accepted"
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allBlogsClub: async (obj, {idClub}, context, info) =>  {
            try {
                await assertCanAccessClub(context, idClub);

                const blogsClub = await Blog.findAll({
                    where: {
                        id_club: idClub
                    }
                })

                const blogsTeam = await Blog.findAll({
                    include: {
                        model: Team,
                        as: "team",
                        right: true,
                        required: true,
                        where: {
                            id_club: idClub
                        }
                    }
                })

                return [...blogsClub, ...blogsTeam]
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allBlogsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                await assertCanAccessTeam(context, idTeam);

                return await Blog.findAll({
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

    Blog: {
        club: async ({id_club}, {}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        team: async ({id_team}, {}, context, info) =>  {
            try {
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        attachment: async ({id}, {}, context, info) =>  {
            try {
                return await AttachmentBlog.findAll({
                    where: {
                        id_blog: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },


    Mutation: {
        createBlog: async (obj, {content}, context, info) =>  {
            try {
                await assertCanAccessRecordScope(context, content);

                const attachment = await content.attachment;

                let blog = await Blog.create({...content})

                if (blog && attachment && attachment.length > 0) {
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

                        await AttachmentBlog.create({content: imgUniqName, id_blog: blog.id})
                    }
                }

                return blog
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("Unable to create blog")
                throw new ApolloError(error)
            }
        },

        updateBlog: async (obj, {id, content}, context, info) =>  {
            try {
                const blog = await Blog.findByPk(id);
                if (!blog) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessRecordScope(context, blog);
                await assertCanAccessRecordScope(context, content);

                const attachment = await content.attachment;

                let result = await Blog.update({...content}, { where: { id } })

                if (attachment && attachment.length > 0) {
                    await AttachmentBlog.destroy({where: {id_blog: id}})

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

                        await AttachmentBlog.create({content: imgUniqName, id_blog: id})
                    }
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteBlog: async (obj, {id}, context, info) =>  {
            try {
                const currentBlog = await Blog.findByPk(id);
                if (!currentBlog) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessRecordScope(context, currentBlog);

                const blog = await Blog.destroy({ where: { id } })

                return {
                    status: blog === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        }
    }
}
