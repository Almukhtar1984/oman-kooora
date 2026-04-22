import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Club, Team, Stadium, Reservations} from '../../Models/index.mjs';
import {v4 as UUID} from "uuid";
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream} from "fs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        stadium: async (obj, {id}, context, info) =>  {
            try {
                return await Stadium.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allStadiumsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Stadium.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allStadiums: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Stadium.findAll()
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allReservations: async (obj, {idStadium}, context, info) =>  {
            try {
                return await Reservations.findAll({
                    where: {
                        id_stadium: idStadium
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Stadium: {
        team: async ({id_team}, {}, context, info) =>  {
            try {
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Reservations: {
        stadium: async ({id_stadium}, {}, context, info) =>  {
            try {
                return await Stadium.findByPk(id_stadium)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Mutation: {
        createStadium: async (obj, {content}, context, info) =>  {
            try {
                const images = await content.images;
                delete content.images

                let stadium = await Stadium.create({...content, image: ""})

                if (stadium && images && images.length > 0) {
                    const listType = ["JPEG", "JPG", "PNG"]
                    let imagesUpload = [];

                    for (let i = 0; i < images.length; i++) {
                        const { createReadStream, filename, mimetype, encoding } = await images[i];

                        const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        const isImage = listType.indexOf(imgType) !== -1

                        if(!isImage) { return new ApolloError("This file is not image") }

                        const imgUniqName = `${UUID()}.${imgType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        imagesUpload.push(imgUniqName)
                    }

                    await Stadium.update({images: imagesUpload.join(",")}, {where: {id: stadium.id}})
                }

                return stadium
            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateStadium: async (obj, {id, content}, context, info) =>  {
            try {
                const images = await content.images;
                delete content.images

                let result = await Stadium.update({...content}, { where: { id } })

                if (images && images.length > 0) {
                    const listType = ["JPEG", "JPG", "PNG"]
                    let imagesUpload = [];

                    for (let i = 0; i < images.length; i++) {
                        const { createReadStream, filename, mimetype, encoding } = await images[i];

                        const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        const isImage = listType.indexOf(imgType) !== -1

                        if(!isImage) { return new ApolloError("This file is not image") }

                        const imgUniqName = `${UUID()}.${imgType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        imagesUpload.push(imgUniqName)
                    }

                    await Stadium.update({images: imagesUpload.join(",")}, {where: {id}})
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteStadium: async (obj, {id}, context, info) =>  {
            try {
                const meeting = await Stadium.destroy({ where: { id } })

                return {
                    status: meeting === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createReservations: async (obj, {content}, context, info) =>  {
            try {
                const reservations =  await Reservations.findAll({
                    where: {
                        id_stadium: content.id_stadium,
                        booking_date: content.booking_date,
                        [Op.or]: [
                            {[Op.and]: [
                                {booking_start: {[Op.lte]: content.booking_start}},
                                {booking_start: {[Op.lte]: content.booking_end}}
                            ]},

                            {[Op.and]: [
                                {booking_end: {[Op.gte]: content.booking_start}},
                                {booking_end: {[Op.gte]: content.booking_end}}
                            ]},
                        ]
                    }
                })

                if (reservations.length > 0) {
                    return new ApolloError("This time is reserved", "TIME_IS_RESERVED");
                }

                return await Reservations.create({...content})
            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
