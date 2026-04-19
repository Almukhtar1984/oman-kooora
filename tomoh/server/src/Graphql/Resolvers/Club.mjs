import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Club, ClubManagement, Members, Person, Team, User,} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        club: async (obj, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allClub: async (obj, {}, context, info) =>  {
            try {
                return await Club.findAll()
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Club: {
        admin: async ({id}, {}, context, info) =>  {
            try {
                return await User.findOne({
                    include: {
                        model: Person,
                        as: "person",
                        required: true,
                        right: true,
                        include: {
                            model: ClubManagement,
                            as: "club_management",
                            required: true,
                            right: true,
                            where: {
                                id_club: id
                            }
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        teams: async ({id}, {}, context, info) =>  {
            try {
                return await Team.findAll({
                    where: {
                        id_club: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
        createClub: async (obj, {content}, context, info) =>  {
            try {
                let club = await Club.create({
                    name:           content.name,
                    governorate:    content.governorate,
                    phone:          content.phone
                })
                let imgUniqName = "";

                if (club && content.logo) {
                    const listType = ["JPEG", "JPG", "PNG"]

                    const { createReadStream, filename, mimetype, encoding } = await content.logo;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Club.update({logo: imgUniqName}, { where: { id: club.id } })
                }

                return {
                    ...club.dataValues,
                    logo: imgUniqName
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        updateClub: async (obj, {id, content}, context, info) =>  {
            try {
                let result = null;

                if (content.account_status !== null && content.account_status !== undefined) {
                    result = await Club.update({
                        name:           content.name,
                        governorate:    content.governorate,
                        phone:          content.phone,
                        account_status: content.account_status
                    }, { where: { id } })
                } else {
                    result = await Club.update({
                        name:           content.name,
                        governorate:    content.governorate,
                        phone:          content.phone
                    }, { where: { id } })
                }

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

                    await Club.update({logo: imgUniqName}, { where: { id } })
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                console.log(error)
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteClub: async (obj, {id}, context, info) =>  {
            try {
                const club = await Club.destroy({ where: { id } })

                return {
                    status: club === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
