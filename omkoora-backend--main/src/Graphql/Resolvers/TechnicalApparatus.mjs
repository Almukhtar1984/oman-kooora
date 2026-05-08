import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Members, Person, Players, Team, TechnicalApparatus} from '../../Models/index.mjs';
import {v4 as UUID} from "uuid";
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream} from "fs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        technicalApparatus: async (obj, {id}, context, info) =>  {
            try {
                return await TechnicalApparatus.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTechnicalApparatus: async (obj, {idTeam}, context, info) =>  {
            try {
                return await TechnicalApparatus.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTechnicalApparatusClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await TechnicalApparatus.findAll({
                    include: {
                        model: Team,
                        as: "team",
                        required: true,
                        right: true,
                        where: {
                            id_club: idClub
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    TechnicalApparatus: {
        person: async ({id_person}, {}, context, info) =>  {
            if (!id_person) return null;
            try {
                if (context?.loaders?.person) {
                    return await context.loaders.person.load(id_person);
                }
                return await Person.findByPk(id_person)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Mutation: {
        createTechnicalApparatus: async (obj, {content}, context, info) =>  {
            try {
                const onePerson = await Person.findOne({ where: {card_number: content.person.card_number, phone: content.person.phone} })
                if (onePerson) {
                    if (onePerson.card_number === content.person.card_number) {
                        return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS")
                    } else if (onePerson.phone === content.person.phone) {
                        return new ApolloError("phone number already exists", "PHONE_NUMBER_ALREADY_EXISTS")
                    }
                }

                let person = await Person.create(content.person)

                let result = null
                if (person) {
                    let uniqName = "";

                    if (content.testimony_experience) {
                        const { createReadStream, filename, mimetype, encoding } = await content.testimony_experience;

                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        if(fileType !== "PDF") { return new ApolloError("This file is not pdf") }

                        uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );
                    }

                    result = await TechnicalApparatus.create({
                        ...content,
                        testimony_experience: uniqName,
                        id_person: person.id
                    })
                }

                return result
            } catch (error) {
                console.log({ error })
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateTechnicalApparatus: async (obj, {id, idPerson, content}, context, info) =>  {
            try {
                let person = null
                if (content.person) {
                    const personPatch = {...content.person};
                    if (!personPatch.personal_picture) delete personPatch.personal_picture;
                    person = await Person.update(personPatch, { where: { id: idPerson } })
                }

                const testimonyExperience = await content.testimony_experience
                let uniqName = "";
                if (testimonyExperience) {
                    const { createReadStream, filename, mimetype, encoding } = testimonyExperience;

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(fileType !== "PDF") { return new ApolloError("This file is not pdf") }

                    uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );
                }

                let result = await TechnicalApparatus.update({...content, testimony_experience: uniqName}, { where: { id } })

                return {
                    status: result[0] === 1 || person[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        changeStatusTechnicalApparatus: async (obj, {id, status, note}, context, info) =>  {
            try {

                let result = await TechnicalApparatus.update({status, note}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteTechnicalApparatus: async (obj, {id}, context, info) =>  {
            try {
                const technicalApparatus = await TechnicalApparatus.findByPk(id)
                const result = await TechnicalApparatus.destroy({ where: { id } })

                if (result === 1) {
                    await Person.destroy({ where: { id: technicalApparatus.id_person } })
                }
                return {
                    status: result === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}