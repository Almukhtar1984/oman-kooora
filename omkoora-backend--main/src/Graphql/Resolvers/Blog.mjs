import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Club, Team, Blog, AttachmentBlog} from '../../Models/index.mjs';
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
            console.log("test")
            try {
                return await Blog.findAll({
                    where: {
                        status: "accepted"
                    },
                    order: [['createdAt', 'DESC']]
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allBlogsClub: async (obj, {idClub}, context, info) =>  {
            console.log("idClub:",idClub)
            try {
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

                console.log({blogsTeam})

                return [...blogsClub, ...blogsTeam]
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allBlogsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Blog.findAll({
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

    Blog: {
        // Arabic label for the mobile app's news category chip.
        category_label: ({category}) => {
            const labels = {
                news: "أخبار",
                competitions: "مسابقات",
                players: "لاعبين",
                clubs: "أندية",
            };
            return category ? (labels[category] || category) : null;
        },
        // Human-readable relative time ("منذ 3 ساعات") derived from createdAt.
        time_ago: ({createdAt}) => {
            if (!createdAt) return null;
            const then = new Date(createdAt).getTime();
            if (Number.isNaN(then)) return null;
            let s = Math.floor((Date.now() - then) / 1000);
            if (s < 0) s = 0;
            const units = [
                { limit: 60, div: 1, one: "منذ ثانية", two: "منذ ثانيتين", few: "منذ %d ثوانٍ", many: "منذ %d ثانية" },
                { limit: 3600, div: 60, one: "منذ دقيقة", two: "منذ دقيقتين", few: "منذ %d دقائق", many: "منذ %d دقيقة" },
                { limit: 86400, div: 3600, one: "منذ ساعة", two: "منذ ساعتين", few: "منذ %d ساعات", many: "منذ %d ساعة" },
                { limit: 2592000, div: 86400, one: "منذ يوم", two: "منذ يومين", few: "منذ %d أيام", many: "منذ %d يوماً" },
                { limit: 31536000, div: 2592000, one: "منذ شهر", two: "منذ شهرين", few: "منذ %d أشهر", many: "منذ %d شهراً" },
                { limit: Infinity, div: 31536000, one: "منذ سنة", two: "منذ سنتين", few: "منذ %d سنوات", many: "منذ %d سنة" },
            ];
            for (const u of units) {
                if (s < u.limit) {
                    const n = Math.floor(s / u.div);
                    if (n <= 1) return u.one;
                    if (n === 2) return u.two;
                    if (n >= 3 && n <= 10) return u.few.replace("%d", n);
                    return u.many.replace("%d", n);
                }
            }
            return null;
        },
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
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateBlog: async (obj, {id, content}, context, info) =>  {
            try {
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
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteBlog: async (obj, {id}, context, info) =>  {
            try {
                const blog = await Blog.destroy({ where: { id } })

                return {
                    status: blog === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        // Mobile app: bump the view counter when a news article is opened.
        incrementBlogViews: async (obj, {id}, context, info) =>  {
            try {
                const [affected] = await Blog.increment("views_count", { by: 1, where: { id } })
                // Sequelize.increment returns [[rows, meta]]; treat any match as success.
                const changed = Array.isArray(affected) ? (affected[1] ?? affected[0]) : affected
                return {
                    status: (typeof changed === "number" ? changed : 1) >= 0
                }
            } catch (error) {
                logger.error(`incrementBlogViews: ${error?.message}`)
                throw new ApolloError(error)
            }
        }
    }
}
