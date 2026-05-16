import { ApolloError, AuthenticationError } from 'apollo-server-express';
import sequelize, {where} from 'sequelize';
import dotenv from 'dotenv';

import logger from "../../Config/logger.mjs";
import db from "../../Config/DBContact.mjs";

import {Members, Person, Players, Team, User, TechnicalApparatus, Permission} from '../../Models/index.mjs';
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
        },
        team: async ({id_team}, {}, context, info) =>  {
            if (!id_team) return null;
            try {
                if (context?.loaders?.team) {
                    return await context.loaders.team.load(id_team);
                }
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
                    const memberPayload = { ...content };
                    if (!memberPayload.membership_date_end) memberPayload.membership_date_end = null;
                    if (!memberPayload.membership_date) memberPayload.membership_date = null;
                    result = await Members.create({...memberPayload, id_person: person.id})
                }

                return result
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createAdminMember: async (obj, {content}, context, info) =>  {
            // Roles are stored as strings: "1" = super-admin, "2" = club admin, "3" = team user.
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

            const alreadyExist = await alreadyExistUser(content.user.email);
            if (alreadyExist !== false) {
                return new ApolloError(alreadyExist.message, alreadyExist.code)
            }

            // Wrap Person/Member/User/Permission writes in a single transaction
            // so a failure mid-way (e.g. unique-constraint on User) doesn't
            // leave orphan Person/Member rows the caller can never log into.
            try {
                return await db.transaction(async (t) => {
                    const person = await Person.create(content.user.person, { transaction: t });

                    const memberPayload = { ...content };
                    delete memberPayload.user;
                    // MySQL refuses empty strings on DATE/DATETIME columns.
                    // Normalize the optional end-of-membership date so the
                    // form can keep its convenient "" default.
                    if (!memberPayload.membership_date_end) memberPayload.membership_date_end = null;
                    if (!memberPayload.membership_date) memberPayload.membership_date = null;
                    const member = await Members.create(
                        { ...memberPayload, id_person: person.id },
                        { transaction: t }
                    );

                    const password = await hashPassword(content.user.password);
                    const newUser = await User.create({
                        email: content.user.email,
                        password,
                        role: requestedRole,
                        activation: true,
                        email_verify: true,
                        id_person: person.id,
                    }, { transaction: t });

                    // Grant the new team admin a permission row covering every
                    // section. Without this currentUser.permission is null and
                    // the team dashboard sidebar renders empty after login.
                    const fullGrant = "1,2,3,4,5,6,7,8,9,10";
                    await Permission.create({
                        teams: fullGrant,
                        members: fullGrant,
                        technicals: fullGrant,
                        players: fullGrant,
                        transfer_players: fullGrant,
                        loan_players: fullGrant,
                        assembly: fullGrant,
                        inbox: fullGrant,
                        outbox: fullGrant,
                        meeting: fullGrant,
                        blogs: fullGrant,
                        forms: fullGrant,
                        permissions: fullGrant,
                        complaints: fullGrant,
                        expenses: fullGrant,
                        leagues: fullGrant,
                        id_user: newUser.id,
                    }, { transaction: t });

                    return member;
                });
            } catch (error) {
                logger.error(`createAdminMember error: ${error.message}`)
                throw new ApolloError(error)
            }
        },

        updateAdminMember: async (obj, {id, idPerson, content}, context, info) =>  {
            try {
                let personResult = null
                if (content.user && content.user.person) {
                    const personPatch = {...content.user.person};
                    if (!personPatch.personal_picture) delete personPatch.personal_picture;
                    personResult = await Person.update(personPatch, { where: { id: idPerson } })
                }

                // Members.update only takes member-table columns. Strip the
                // nested user payload before passing it through.
                const memberPatch = {...content};
                delete memberPatch.user;
                // Empty strings on DATE columns make MySQL throw
                // ER_TRUNCATED_WRONG_VALUE — normalize to null so the form
                // can keep its "" defaults for optional date fields.
                if (memberPatch.membership_date === "") memberPatch.membership_date = null;
                if (memberPatch.membership_date_end === "") memberPatch.membership_date_end = null;
                const memberResult = await Members.update(memberPatch, { where: { id } });

                // Build a User-only patch. Email is updated when supplied;
                // password is only touched when the caller explicitly sent a
                // new non-empty value, otherwise the existing hash stays put.
                // (The previous version had a typo — `passwor` — and ended up
                // overwriting password with an empty string on every save,
                // which silently locked the manager out.)
                let userResult = null;
                if (content.user) {
                    const userPatch = {};
                    if (content.user.email !== undefined && content.user.email !== null) {
                        userPatch.email = content.user.email;
                    }
                    if (content.user.password && content.user.password !== "") {
                        userPatch.password = await hashPassword(content.user.password);
                    }
                    if (Object.keys(userPatch).length > 0) {
                        userResult = await User.update(userPatch, { where: { id_person: idPerson } });
                    }
                }

                return {
                    status: (memberResult && memberResult[0] === 1)
                        || (personResult && personResult[0] === 1)
                        || (userResult && userResult[0] === 1)
                }
            } catch (error) {
                logger.error(`updateAdminMember error: ${error.message}`)
                throw new ApolloError(error)
            }
        },

        updateMember: async (obj, {id, idPerson, content}, context, info) =>  {
            console.log("---------updateMember-----------")
            console.log(content)
            try {
                let person = null
                if (content.person) {
                    const personPatch = {...content.person};
                    if (!personPatch.personal_picture) delete personPatch.personal_picture;
                    person = await Person.update(personPatch, { where: { id: idPerson } })
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

        changeStatusMembersBulk: async (obj, {ids, status, note}, context, info) =>  {
            try {
                if (!ids || ids.length === 0) {
                    return { success: 0, total: 0 }
                }

                const patch = note !== undefined && note !== null ? {status, note} : {status}
                const [affected] = await Members.update(patch, { where: { id: { [Op.in]: ids } } })

                if (affected > 0 && (status === "accepted" || status === "rejected")) {
                    const updated = await Members.findAll({ where: { id: { [Op.in]: ids } } })
                    for (const m of updated) {
                        try {
                            CreateNotificationTeam("memeber", "update", m.id_team, m.id)
                        } catch (e) {
                            logger.error(`bulk member notification failed for ${m.id}: ${e.message}`)
                        }
                    }
                }

                return { success: affected, total: ids.length }
            } catch (error) {
                logger.error(`changeStatusMembersBulk error: ${error.message}`)
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