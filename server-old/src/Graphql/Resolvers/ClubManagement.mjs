import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Club, ClubManagement, Members, Person, User} from '../../Models/index.mjs';
import {alreadyExistUser, hashPassword} from "../../Helpers/index.mjs";
import {assertCanAccessClub, assertCanAccessRecordScope} from "../../Helpers/Authorization.mjs";

dotenv.config();

const {Op, col} = sequelize;

const normalizeClubManagementUserUpdate = (userInput = {}) => {
    const update = {};

    if (userInput.email !== undefined) {
        update.email = userInput.email;
    }

    if (userInput.activation !== undefined) {
        update.activation = userInput.activation;
    }

    if (userInput.email_verify !== undefined) {
        update.email_verify = userInput.email_verify;
    }

    if (userInput.role !== undefined) {
        update.role = ["1", "2", "3", "4"].includes(`${userInput.role}`) ? `${userInput.role}` : "2";
    }

    return update;
}

export const resolvers = {
    Query: {
        clubManagement: async (obj, {id}, context, info) =>  {
            try {
                const clubManagement = await ClubManagement.findByPk(id)
                await assertCanAccessRecordScope(context, clubManagement);

                return clubManagement
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allClubManagement: async (obj, {idClub}, context, info) =>  {
            try {
                await assertCanAccessClub(context, idClub);

                return await ClubManagement.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    ClubManagement: {
        club: async ({id_club}, {}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        person: async ({id_person }, {}, context, info) =>  {
            try {
                return await Person.findByPk(id_person )
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
        createClubManagement: async (obj, {content}, context, info) =>  {
            try {
                await assertCanAccessRecordScope(context, content);

                const onePerson = await Person.findOne({ where: {card_number: content.user.person.card_number} })
                if (onePerson) {
                    return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS")
                }

                let alreadyExist = await alreadyExistUser(content.user.email);

                if (alreadyExist !== false) {
                    return new ApolloError(alreadyExist.message, alreadyExist.code)
                }

                let person = await Person.create(content.user.person)

                let result = null
                if (person) {
                    result = await ClubManagement.create({...content, id_person: person.id})

                    let password = await hashPassword(content.user.password);

                    let user = await User.create({
                        ...content.user,
                        id_person: person.id,
                        role: content.user.role,
                        password,
                        activation: true,
                        email_verify: true
                    })
                }

                return result
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        updateClubManagement: async (obj, {id, idPerson, content}, context, info) =>  {
            try {
                const clubManagement = await ClubManagement.findByPk(id);
                if (!clubManagement) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessRecordScope(context, clubManagement);
                await assertCanAccessRecordScope(context, content);

                let person = null
                if (content.user.person) {
                    person = await Person.update({...content.user.person}, { where: { id: idPerson } })
                }

                let result = await ClubManagement.update({membership_date: content.membership_date, membership_date_end: content.membership_date_end}, { where: { id } })

                const userUpdate = normalizeClubManagementUserUpdate(content.user);

                let user = null
                if (content.user.password && content.user.password.trim() !== "") {
                    userUpdate.password = await hashPassword(content.user.password);
                }

                user = await User.update(userUpdate, { where: { id_person: idPerson } })

                return {
                    status: result[0] === 1 || person[0] === 1 || user[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteClubManagement: async (obj, {id}, context, info) =>  {
            try {
                const clubManagement = await ClubManagement.findByPk(id);
                if (!clubManagement) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessRecordScope(context, clubManagement);

                const team = await ClubManagement.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
