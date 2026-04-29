import { ApolloError } from 'apollo-server-express';
import logger from "../../Config/logger.mjs";
import {Event, Team} from '../../Models/index.mjs';
import {v4 as UUID} from "uuid";
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream, existsSync, mkdirSync, readdirSync, unlinkSync, rmSync, statSync} from "fs";

export const resolvers = {
    Query: {
        allEvents: async (obj, {idTeam}, context, info) => {
            try {
                return await Event.findAll({
                    where: { id_team: idTeam },
                    order: [['date', 'DESC']]
                });
            } catch (error) {
                logger.error("Error fetching all events: " + error.message);
                throw new ApolloError(error);
            }
        },
        event: async (obj, {id}, context, info) => {
            try {
                return await Event.findByPk(id);
            } catch (error) {
                logger.error("Error fetching event: " + error.message);
                throw new ApolloError(error);
            }
        }
    },

    Event: {
        team: async ({id_team}, args, context, info) => {
            try {
                return await Team.findByPk(id_team);
            } catch (error) {
                logger.error("Error fetching team for event: " + error.message);
                throw new ApolloError(error);
            }
        },
        imageList: async ({images}) => {
            try {
                if (!images) return [];
                
                // Handle legacy comma-separated list
                if (images.includes(',')) {
                    return images.split(',').filter(i => i.trim() !== "");
                }

                const folderPath = path.join(__dirname, `./../uploads/events/${images}`);
                if (existsSync(folderPath)) {
                    const stats = statSync(folderPath);
                    if (stats.isDirectory()) {
                        return readdirSync(folderPath);
                    }
                }
                
                // Handle legacy single filename
                if (images.includes('.') && !images.includes('/') && !images.includes('\\')) {
                    return [images];
                }

                return [];
            } catch (error) {
                logger.error("Error reading event images: " + error.message);
                return [];
            }
        }
    },

    Mutation: {
        createEvent: async (obj, {content}, context, info) => {
            try {
                const images = await content.images;
                const folderName = UUID();
                const folderPath = path.join(__dirname, `./../uploads/events/${folderName}`);

                if (images && images.length > 0) {
                    if (!existsSync(folderPath)) {
                        mkdirSync(folderPath, { recursive: true });
                    }
                    for (let i = 0; i < images.length; i++) {
                        const { createReadStream, filename } = await images[i];
                        const imgType = filename.split(".").pop().toUpperCase();
                        const imgUniqName = `${UUID()}.${imgType}`;
                        const pathName = path.join(folderPath, imgUniqName);

                        const stream = createReadStream();
                        await stream.pipe(createWriteStream(pathName));
                    }
                }

                return await Event.create({
                    name:        content.name,
                    description: content.description,
                    date:        content.date,
                    images:      folderName,
                    id_team:     content.id_team
                });
            } catch (error) {
                logger.error("Error creating event: " + error.message);
                throw new ApolloError(error);
            }
        },

        updateEvent: async (obj, {id, content}, context, info) => {
            try {
                const images = await content.images;
                const { deletedImages } = content;
                let payload = { ...content };
                delete payload.images;
                delete payload.deletedImages;

                const event = await Event.findByPk(id);
                if (!event) throw new Error("Event not found");

                let folderName = event.images;

                // Handle image deletions
                if (deletedImages && deletedImages.length > 0 && folderName) {
                    // Only support deletion from folder-based storage
                    if (!folderName.includes(',') && !folderName.includes('.')) {
                        const folderPath = path.join(__dirname, `./../uploads/events/${folderName}`);
                        if (existsSync(folderPath)) {
                            deletedImages.forEach(img => {
                                const filePath = path.join(folderPath, img);
                                if (existsSync(filePath)) {
                                    unlinkSync(filePath);
                                }
                            });
                        }
                    }
                }

                if (images && images.length > 0) {
                    // If old images were stored as a string list, we should create a new folder
                    // or if it's empty.
                    if (!folderName || folderName.includes(',') || folderName.includes('.')) {
                        folderName = UUID();
                    }

                    const folderPath = path.join(__dirname, `./../uploads/events/${folderName}`);
                    if (!existsSync(folderPath)) {
                        mkdirSync(folderPath, { recursive: true });
                    }

                    for (let i = 0; i < images.length; i++) {
                        const { createReadStream, filename } = await images[i];
                        const imgType = filename.split(".").pop().toUpperCase();
                        const imgUniqName = `${UUID()}.${imgType}`;
                        const pathName = path.join(folderPath, imgUniqName);

                        const stream = createReadStream();
                        await stream.pipe(createWriteStream(pathName));
                    }
                    payload.images = folderName;
                }

                const result = await Event.update(payload, { where: { id } });
                return {
                    status: result[0] === 1
                };
            } catch (error) {
                logger.error("Error updating event: " + error.message);
                throw new ApolloError(error);
            }
        },

        deleteEvent: async (obj, {id}, context, info) => {
            try {
                const event = await Event.findByPk(id);
                if (event && event.images) {
                    const folderName = event.images;
                    // If it's a folder (no dots, no commas), delete the whole folder
                    if (!folderName.includes(',') && !folderName.includes('.')) {
                        const folderPath = path.join(__dirname, `./../uploads/events/${folderName}`);
                        if (existsSync(folderPath)) {
                            rmSync(folderPath, { recursive: true, force: true });
                        }
                    }
                }
                const result = await Event.destroy({ where: { id } });
                return {
                    status: result === 1
                };
            } catch (error) {
                logger.error("Error deleting event: " + error.message);
                throw new ApolloError(error);
            }
        }
    }
};
