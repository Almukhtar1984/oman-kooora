import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Club, Members, Person, Assembly, User, Team, Players,} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        assembly: async (obj, {id}, context, info) =>  {
            try {
                return await Assembly.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allAssemblyClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Assembly.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allAssemblyTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Assembly.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

    },

    Assembly: {
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
    },

    Mutation: {
        createAssembly: async (obj, {content}, context, info) =>  {
            try {
                const nationalID = await content.nationalID
                const nationalIDBack = await content.nationalIDBack
                const personal_picture = await content.personal_picture

                const oldPersonalPicture = content.oldPersonalPicture
                const oldNationalID = content.oldNationalID
                const oldNationalIDBack = content.oldNationalIDBack
             

                const oneAssembly = await Assembly.findOne({where: {card_number: content.card_number}})
                if (oneAssembly) {
                    return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS")
                }

                let data = {...content}

                if (nationalID) {
                    console.log("nationalID:",nationalID)
                    const { createReadStream, filename, mimetype, encoding } = nationalID;
                    const listType = ["JPEG", "JPG", "PNG"]

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    data = {...data, nationalID: uniqName}
                } else {
                    data = {...data, nationalID: oldNationalID}
                }

                if (nationalIDBack) {
                    const { createReadStream, filename, mimetype, encoding } = nationalIDBack;
                    const listType = ["JPEG", "JPG", "PNG"]

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    data = {...data, nationalIDBack: uniqName}
                } else {
                    data = {...data, nationalIDBack: oldNationalIDBack}
                }

                if (personal_picture) {
                    const { createReadStream, filename, mimetype, encoding } = personal_picture;
                    const listType = ["JPEG", "JPG", "PNG"]

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    data = {...data, personal_picture: uniqName}
                } else {
                    data = {...data, personal_picture: oldPersonalPicture}
                }

                return await Assembly.create({...data})
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        updateAssembly: async (obj, {id, content}, context, info) =>  {
            try {
                const nationalID = await content.nationalID
                const nationalIDBack = await content.nationalIDBack

                const personal_picture = await content.personal_picture

                if (nationalID || nationalIDBack || personal_picture) {
                    let data = {...content}

                    if (nationalID) {
                        const { createReadStream, filename, mimetype, encoding } = nationalID;
                        const listType = ["JPEG", "JPG", "PNG"]

                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                        let uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        data = {...data, nationalID: uniqName}
                    }

                    if (nationalIDBack) {
                        const { createReadStream, filename, mimetype, encoding } = nationalIDBack;
                        const listType = ["JPEG", "JPG", "PNG"]

                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        if(!listType.includes(fileType)) { return new ApolloError("national ID Back is not image") }

                        let uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        data = {...data, nationalIDBack: uniqName}
                    }

                    if (personal_picture) {
                        const { createReadStream, filename, mimetype, encoding } = personal_picture;
                        const listType = ["JPEG", "JPG", "PNG"]

                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        if(!listType.includes(fileType)) { return new ApolloError("personal_picture ID is not image") }

                        let uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        data = {...data, personal_picture: uniqName}
                    }

                    let result = await Assembly.update({...data}, { where: { id } })

                    return {
                        status: result[0] === 1
                    }
                } else {
                    let result = await Assembly.update({...content}, { where: { id } })

                    return {
                        status: result[0] === 1
                    }
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteAssembly: async (obj, {id}, context, info) =>  {
            try {
                const team = await Assembly.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    }
}