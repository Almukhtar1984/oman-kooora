import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Club, ClubManagement, Members, Person, User} from '../../Models/index.mjs';
import {alreadyExistUser, hashPassword} from "../../Helpers/index.mjs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        clubManagement: async (obj, {id}, context, info) =>  {
            try {
                return await ClubManagement.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allClubManagement: async (obj, {idClub}, context, info) =>  {
            try {
                return await ClubManagement.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
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
                console.log("dkhall createClubManagement")
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
                logger.error("")
                throw new ApolloError(error)
            }
        },

        updateClubManagement: async (obj, {id, idPerson, content}, context, info) =>  {
          
            try {
             
                let person = null
                if (content.user.person) {
                    person = await Person.update({...content.user.person}, { where: { id: idPerson } })
                }

                let result = await ClubManagement.update({membership_date: content.membership_date, membership_date_end: content.membership_date_end}, { where: { id } })
                
                // Build a User-only patch. `content.user` also carries the
                // nested person payload and never belongs in User.update as-is.
                // Password is touched only when the caller sent a new non-empty
                // value, otherwise the existing hash stays put. (The previous
                // version had a typo — `passwor` — so an empty password field
                // was written straight through, wiping the hash and locking the
                // manager out on the next login.)
                let user = null
                const userPatch = {}

                if (content.user.email !== undefined && content.user.email !== null && content.user.email !== "") {
                    // Two users sharing an email make login ambiguous: the save
                    // lands on this row while authenticateUser resolves the
                    // other one. Refuse instead of creating that state.
                    const clash = await User.findOne({
                        where: {
                            email: content.user.email,
                            id_person: { [Op.ne]: idPerson }
                        }
                    })

                    if (clash) {
                        return new ApolloError("email already exists", "EMAIL_ALREADY_EXIST")
                    }

                    userPatch.email = content.user.email
                }

                if (content.user.role !== undefined && content.user.role !== null && content.user.role !== "") {
                    userPatch.role = content.user.role
                }

                if (content.user.password && content.user.password !== "") {
                    userPatch.password = await hashPassword(content.user.password);
                }

                if (Object.keys(userPatch).length > 0) {
                    user = await User.update(userPatch, { where: { id_person: idPerson } })
                }
              
                return {
                    status: (result && result[0] === 1)
                        || (person && person[0] === 1)
                        || (user && user[0] === 1)
                }
            } catch (error) {
                
                logger.error("error",error)
                throw new ApolloError(error)
            }
        },

        deleteClubManagement: async (obj, {id}, context, info) =>  {
            try {
                const team = await ClubManagement.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}