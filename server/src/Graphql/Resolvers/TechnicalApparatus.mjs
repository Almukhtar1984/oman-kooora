import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Members, Person, Players, Team, TechnicalApparatus} from '../../Models/index.mjs';
import {assertCanAccessClub, assertCanAccessTeam} from "../../Helpers/Authorization.mjs";
import {savePdfUpload} from "../../Helpers/Upload.mjs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        technicalApparatus: async (obj, {id}, context, info) =>  {
            try {
                const technicalApparatus = await TechnicalApparatus.findByPk(id)
                await assertCanAccessTeam(context, technicalApparatus?.id_team);

                return technicalApparatus
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTechnicalApparatus: async (obj, {idTeam}, context, info) =>  {
            try {
                await assertCanAccessTeam(context, idTeam);

                return await TechnicalApparatus.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTechnicalApparatusClub: async (obj, {idClub}, context, info) =>  {
            try {
                await assertCanAccessClub(context, idClub);

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
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    TechnicalApparatus: {
        person: async ({id_person}, {}, context, info) =>  {
            try {
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
                await assertCanAccessTeam(context, content.id_team);

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
                        uniqName = await savePdfUpload(content.testimony_experience);
                    }

                    result = await TechnicalApparatus.create({
                        ...content,
                        testimony_experience: uniqName,
                        id_person: person.id
                    })
                }

                return result
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("Unable to create technical apparatus")
                throw new ApolloError(error)
            }
        },

        updateTechnicalApparatus: async (obj, {id, idPerson, content}, context, info) =>  {
            try {
                const technicalApparatus = await TechnicalApparatus.findByPk(id);
                if (!technicalApparatus) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessTeam(context, technicalApparatus.id_team);
                await assertCanAccessTeam(context, content.id_team);

                let person = null
                if (content.person) {
                    person = await Person.update({...content.person}, { where: { id: idPerson } })
                }

                const testimonyExperience = await content.testimony_experience
                let uniqName = "";
                if (testimonyExperience) {
                    uniqName = await savePdfUpload(testimonyExperience);
                }

                let result = await TechnicalApparatus.update({...content, testimony_experience: uniqName}, { where: { id } })

                return {
                    status: result[0] === 1 || person[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        changeStatusTechnicalApparatus: async (obj, {id, status, note}, context, info) =>  {
            try {
                const technicalApparatus = await TechnicalApparatus.findByPk(id);
                if (!technicalApparatus) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessTeam(context, technicalApparatus.id_team);

                let result = await TechnicalApparatus.update({status, note}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteTechnicalApparatus: async (obj, {id}, context, info) =>  {
            try {
                const technicalApparatus = await TechnicalApparatus.findByPk(id)
                if (!technicalApparatus) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessTeam(context, technicalApparatus.id_team);

                const result = await TechnicalApparatus.destroy({ where: { id }, force: true  })

                if (result === 1) {
                    await Person.destroy({ where: { id: technicalApparatus.id_person }, force: true })
                }

                return {
                    status: result === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
