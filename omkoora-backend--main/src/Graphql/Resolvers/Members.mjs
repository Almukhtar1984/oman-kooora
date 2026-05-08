import { ApolloError, AuthenticationError } from 'apollo-server-express';
import sequelize, {where} from 'sequelize';
import dotenv from 'dotenv';

import logger from "../../Config/logger.mjs";
import db from "../../Config/DBContact.mjs";

import {Members, Person, Players, Team, User, TechnicalApparatus} from '../../Models/index.mjs';
import {alreadyExistUser, hashPassword} from "../../Helpers/index.mjs";
import {CreateNotificationTeam} from "../../Helpers/index.mjs"

dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        member: async (obj, {id}, context, info) =>  {
            try {
                return await Members.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allMembers: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Members.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allMembersHasAccount: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Members.findAll({
                    where: {
                        id_team: idTeam
                    },
                    include: {
                        model: Person,
                        as: "person",
                        required: true,
                        right: true,
                        include: {
                            model: User,
                            as: "user",
                            required: true,
                            right: true
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allMembersClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Members.findAll({
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

    Member: {
        person: async ({id_person}, {}, context, info) =>  {
            try {
                return await Person.findByPk(id_person)
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
        createMember: async (obj, {content}, context, info) =>  {
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
                    result = await Members.create({...content, id_person: person.id})
                }

                return result
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createAdminMember: async (obj, {content}, context, info) =>  {
            try {
                // The @auth directive on this mutation is currently commented out
                // in the schema, so enforce authentication + a role-escalation
                // guard inline. Roles in this codebase are stored as strings:
                //   "1" = super-admin, "2" = club admin, "3" = team user.
                // Without these checks any anonymous caller could promote
                // themselves to "1" by passing role: "1" in the payload.
                const { user, isAuth } = context;
                if (!isAuth || !user) {
                    return new AuthenticationError("Authentication required");
                }
                const requestedRole = content?.user?.role;
                const callerRole = user.role;
                if (requestedRole === "1") {
                    return new ApolloError("Cannot create super-admin via this endpoint", "FORBIDDEN_ROLE");
                }
                if (requestedRole === "2" && callerRole !== "1") {
                    return new ApolloError("Only super-admin can create club admins", "FORBIDDEN_ROLE");
                }
                if (requestedRole === "3" && callerRole !== "1" && callerRole !== "2") {
                    return new ApolloError("Only super-admin or club admin can create team users", "FORBIDDEN_ROLE");
                }
                if (!["2", "3"].includes(requestedRole)) {
                    return new ApolloError("Invalid role", "INVALID_ROLE");
                }

                const onePerson = await Person.findOne({ where: {card_number: content.user.person.card_number, phone: content.user.person.phone} })
                if (onePerson) {
                    if (onePerson.card_number === content.user.person.card_number) {
                        return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS")
                    } else if (onePerson.phone === content.user.person.phone) {
                        return new ApolloError("phone number already exists", "PHONE_NUMBER_ALREADY_EXISTS")
                    }
                }

                let alreadyExist = await alreadyExistUser(content.user.email);

                if (alreadyExist !== false) {
                    return new ApolloError(alreadyExist.message, alreadyExist.code)
                }

                let person = await Person.create(content.user.person)

                let result = null
                if (person) {
                    result = await Members.create({...content, id_person: person.id})

                    let password = await hashPassword(content.user.password);

                    let user = await User.create({
                        ...content.user,
                        id_person: person.id,
                        role: requestedRole,
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

        updateAdminMember: async (obj, {id, idPerson, content}, context, info) =>  {
            try {
                let person = null
                if (content.user.person) {
                    person = await Person.update({...content.user.person}, { where: { id: idPerson } })
                }

                let result = await Members.update({...content}, { where: { id } })

                let user = null
                if (content.user.password && content.user.password !== "") {
                    let password = await hashPassword(content.user.password);
                    user = await User.update({...content.user, password}, { where: { id_person: idPerson } })
                } else {
                    delete content.user.passwor
                    user = await User.update({...content.user}, { where: { id_person: idPerson } })
                }

                return {
                    status: result[0] === 1 || person[0] === 1 || user[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        updateMember: async (obj, {id, idPerson, content}, context, info) =>  {
            console.log("---------updateMember-----------")
            console.log(content)
            try {
                let person = null
                if (content.person) {
                    person = await Person.update({...content.person}, { where: { id: idPerson } })
                }

                let result = await Members.update(content, { where: { id } })

                return {
                    status: result[0] === 1 || person[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        changeStatusMember: async (obj, {id, status, note}, context, info) =>  {
        
            
            try {

                let result = await Members.update({status, note}, { where: { id } })
               
                if(result[0] === 1 && (status == "accepted" || status == "rejected" ) ){    
                    let memeber = await Members.findByPk(id)
                    CreateNotificationTeam("memeber","update",memeber.id_team,memeber.id)

                }
                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteMember: async (obj, {id}, context, info) =>  {
   
            try {
                const member = await Members.findByPk(id)
                const result = await Members.destroy({ where: { id } })

                if (result === 1) {
                    await Person.destroy({ where: { id: member.id_person } })
                }
                
                return {
                    status: result === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        changeMemberClassification: async (obj, args, context, info) => {
            const { id, fromType, toType, ...content } = args;

            if (fromType === toType) {
                throw new ApolloError("From and to types are identical", "INVALID_TYPE_CHANGE");
            }

            const t = await db.transaction();
            try {
                let currentRecord;
                if (fromType === "player") {
                    currentRecord = await Players.findByPk(id, { transaction: t });
                } else if (fromType === "technical") {
                    currentRecord = await TechnicalApparatus.findByPk(id, { transaction: t });
                } else if (fromType === "member") {
                    currentRecord = await Members.findByPk(id, { transaction: t });
                }

                if (!currentRecord) {
                    await t.rollback();
                    throw new ApolloError("Record not found", "RECORD_NOT_FOUND");
                }

                const commonData = {
                    id_person: currentRecord.id_person,
                    id_team: currentRecord.id_team,
                    status: "accepted",
                    note: currentRecord.note,
                };

                let newRecord;
                if (toType === "player") {
                    newRecord = await Players.create({
                        ...commonData,
                        activity: content.activity || "",
                        player_center: content.player_center || "",
                        job: content.job || currentRecord.occupation || currentRecord.job || "",
                        class: content.class && content.class !== "" ? content.class : "firstDegree",
                    }, { transaction: t });
                } else if (toType === "technical") {
                    newRecord = await TechnicalApparatus.create({
                        ...commonData,
                        classification: content.classification || "technical",
                        membership_date: content.membership_date || new Date(),
                        membership_date_end: content.membership_date_end,
                        occupation: content.occupation || content.job || currentRecord.occupation || currentRecord.job || "",
                        testimony_experience: "",
                    }, { transaction: t });
                } else if (toType === "member") {
                    newRecord = await Members.create({
                        ...commonData,
                        classification: content.classification || "member",
                        occupation: content.occupation || content.job || currentRecord.occupation || currentRecord.job || "",
                        membership_date: content.membership_date || new Date(),
                        membership_date_end: content.membership_date_end,
                        paid: false,
                    }, { transaction: t });
                } else {
                    await t.rollback();
                    throw new ApolloError("Invalid toType", "INVALID_TO_TYPE");
                }

                if (!newRecord) {
                    await t.rollback();
                    throw new ApolloError("Failed to create new record", "CREATE_FAILED");
                }

                if (fromType === "player") {
                    await Players.destroy({ where: { id }, transaction: t });
                } else if (fromType === "technical") {
                    await TechnicalApparatus.destroy({ where: { id }, transaction: t });
                } else if (fromType === "member") {
                    await Members.destroy({ where: { id }, transaction: t });
                }

                await t.commit();
                return newRecord;
            } catch (error) {
                if (t && !t.finished) {
                    try { await t.rollback(); } catch (_) { /* already rolled back */ }
                }
                logger.error(error);
                if (error instanceof ApolloError) throw error;
                throw new ApolloError(error.message || "Failed to change classification", "CHANGE_CLASSIFICATION_FAILED");
            }
        },
    }
}