import { ApolloError } from 'apollo-server-express';
import sequelize, {where} from 'sequelize';
import dotenv from 'dotenv';

import logger from "../../Config/logger.mjs";

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
            try {
                let currentRecord;
                if (fromType === "player") {
                    currentRecord = await Players.findByPk(id);
                } else if (fromType === "technical") {
                    currentRecord = await TechnicalApparatus.findByPk(id);
                } else if (fromType === "member") {
                    currentRecord = await Members.findByPk(id);
                }

                if (!currentRecord) {
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
                    });
                } else if (toType === "technical") {
                    newRecord = await TechnicalApparatus.create({
                        ...commonData,
                        classification: content.classification || "technical",
                        membership_date: content.membership_date || new Date(),
                        membership_date_end: content.membership_date_end,
                        occupation: content.occupation || content.job || currentRecord.occupation || currentRecord.job || "",
                        testimony_experience: "",
                    });
                } else if (toType === "member") {
                    newRecord = await Members.create({
                        ...commonData,
                        classification: content.classification || "member",
                        occupation: content.occupation || content.job || currentRecord.occupation || currentRecord.job || "",
                        membership_date: content.membership_date || new Date(),
                        membership_date_end: content.membership_date_end,
                        paid: false,
                    });
                }

                if (newRecord) {
                    if (fromType === "player") {
                        await Players.destroy({ where: { id } });
                    } else if (fromType === "technical") {
                        await TechnicalApparatus.destroy({ where: { id } });
                    } else if (fromType === "member") {
                        await Members.destroy({ where: { id } });
                    }
                    return newRecord;
                }
                return null;
            } catch (error) {
                logger.error(error);
                throw new ApolloError(error);
            }
        },
    }
}