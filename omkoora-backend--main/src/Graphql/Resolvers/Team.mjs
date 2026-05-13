import { ApolloError, AuthenticationError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";
import db from "../../Config/DBContact.mjs";

import {Club, Members, Person, Players, Team, User,TechnicalApparatus, Stadium, Permission} from '../../Models/index.mjs';
import {alreadyExistUser, hashPassword} from "../../Helpers/index.mjs";
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";
import {CreateNotificationTeam} from "../../Helpers/index.mjs"

dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        team: async (obj, {id}, context, info) =>  {
            try {
                return await Team.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTeam: async (obj, {idClub}, context, info) =>  {
            try {
                return await Team.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTeams: async (obj, {}, context, info) =>  {
            try {
                return await Team.findAll()
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        statisticsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                /* status: ["accepted", "rejected", "waiting", "waiting_club"] */
                const numberPlayers = await Players.count({ where: { id_team: idTeam } })
                const numberPlayersWaiting = await Players.count({ where: { id_team: idTeam, status: "waiting" } })
                const numberPlayersRejected = await Players.count({ where: { id_team: idTeam, status: "rejected" } })
                const numberPlayersAccepted = await Players.count({ where: { id_team: idTeam, status: "accepted" } })

                const numberTechnicales = await TechnicalApparatus.count({ where: { id_team: idTeam } })
                const numberMembers = await Members.count({ where: { id_team: idTeam } })
                const numberStadiums = await Stadium.count({ where: { id_team: idTeam } })

                return {
                    numberPlayers: numberPlayers === null ? 0 : numberPlayers,
                    numberPlayersWaiting: numberPlayersWaiting === null ? 0 : numberPlayersWaiting,
                    numberPlayersRejected: numberPlayersRejected === null ? 0 : numberPlayersRejected,
                    numberPlayersAccepted: numberPlayersAccepted === null ? 0 : numberPlayersAccepted,
                    numberTechnicales: numberTechnicales === null ? 0 : numberTechnicales,
                    numberMembers: numberMembers === null ? 0 : numberMembers,
                    numberStadiums: numberStadiums === null ? 0 : numberStadiums
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        statisticsClub: async (obj, {idClub}, context, info) =>  {
            try {
                /* status: ["accepted", "rejected", "waiting", "waiting_club"] */
                const numberTeams = await Team.count({ where: { id_club: idClub } })
                const numberPlayers = await Players.count({
                    include: {
                        model: Team,
                        as: "team",
                        require: true,
                        right: true,
                        where: { id_club: idClub }
                    }
                })
                const numberPlayersWaiting = await Players.count({
                    where: { status: "waiting" },
                    include: {
                        model: Team,
                        as: "team",
                        require: true,
                        right: true,
                        where: { id_club: idClub }
                    }
                })
                const numberPlayersRejected = await Players.count({
                    where: { status: "rejected" },
                    include: {
                        model: Team,
                        as: "team",
                        require: true,
                        right: true,
                        where: { id_club: idClub }
                    }
                })
                const numberPlayersAccepted = await Players.count({
                    where: { status: "accepted" },
                    include: {
                        model: Team,
                        as: "team",
                        require: true,
                        right: true,
                        where: { id_club: idClub }
                    }
                })

                const numberTechnicales = await TechnicalApparatus.count({
                    include: {
                        model: Team,
                        as: "team",
                        require: true,
                        right: true,
                        where: { id_club: idClub }
                    }
                })

                const numberMembers = await Members.count({
                    include: {
                        model: Team,
                        as: "team",
                        require: true,
                        right: true,
                        where: { id_club: idClub }
                    }
                })

                const numberStadiums = await Stadium.count({
                    include: {
                        model: Team,
                        as: "team",
                        require: true,
                        right: true,
                        where: { id_club: idClub }
                    }
                })

                return {
                    numberTeams: numberTeams === null ? 0 : numberTeams,
                    numberPlayers: numberPlayers === null ? 0 : numberPlayers,
                    numberPlayersWaiting: numberPlayersWaiting === null ? 0 : numberPlayersWaiting,
                    numberPlayersRejected: numberPlayersRejected === null ? 0 : numberPlayersRejected,
                    numberPlayersAccepted: numberPlayersAccepted === null ? 0 : numberPlayersAccepted,
                    numberTechnicales: numberTechnicales === null ? 0 : numberTechnicales,
                    numberMembers: numberMembers === null ? 0 : numberMembers,
                    numberStadiums: numberStadiums === null ? 0 : numberStadiums
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Team: {
        admin: async ({id}, {}, context, info) =>  {
            try {
                return await User.findOne({
                    include: {
                        model: Person,
                        as: "person",
                        required: true,
                        right: true,
                        include: {
                            model: Members,
                            as: "member",
                            required: true,
                            right: true,
                            where: {
                                id_team: id
                            }
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        club: async ({id_club}, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
        createTeam: async (obj, {content}, context, info) =>  {
            try {
                let team = await Team.create({
                    name:           content.name,
                    category:       content.category,
                    phone:          content.phone,
                    manager_name:    content.manager_name,
                    activities:    content.activities,
                    code:    content.code,
                    id_club: content.id_club
                })

                if (team && content.logo) {
                    const listType = ["JPEG", "JPG", "PNG"]

                    const { createReadStream, filename, mimetype, encoding } = await content.logo;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    const imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Team.update({logo: imgUniqName}, { where: { id: team.id } })
                }

                return team
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        // Single atomic call used by the "add team" form in the club app.
        // Replaces the previous client-side sequence of createTeam → createAdminMember,
        // which was non-atomic: if the second call failed (e.g. duplicate
        // card_number / phone), the Team row was already committed and the
        // form would refuse to re-submit cleanly, encouraging the user to
        // retry — producing one duplicate Team per click. Wrapping both
        // writes in a single transaction means a manager-side validation
        // failure rolls the Team back as well, so the form is safe to retry.
        createTeamWithAdmin: async (obj, {team, manager}, context, info) => {
            const { user, isAuth } = context;
            if (!isAuth || !user) {
                return new AuthenticationError("Authentication required");
            }
            if (user.role !== "1" && user.role !== "2") {
                return new ApolloError("Only super-admin or club admin can create teams", "FORBIDDEN_ROLE");
            }

            // Pre-check duplicates outside the transaction so the user gets
            // a clear, recoverable error before we touch anything.
            const dupPerson = await Person.findOne({
                where: {
                    card_number: manager?.person?.card_number,
                    phone: manager?.person?.phone,
                }
            });
            if (dupPerson) {
                if (dupPerson.card_number === manager.person.card_number) {
                    return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS");
                }
                if (dupPerson.phone === manager.person.phone) {
                    return new ApolloError("phone number already exists", "PHONE_NUMBER_ALREADY_EXISTS");
                }
            }
            const dupUser = await alreadyExistUser(manager?.email);
            if (dupUser !== false) {
                return new ApolloError(dupUser.message, dupUser.code);
            }

            // Logo arrives as a graphql-upload promise. Resolve it before
            // the transaction starts so the write inside the txn is fast.
            let logoFileName = null;
            if (team?.logo) {
                const file = await team.logo;
                const ext = file.filename.split(".").pop().toUpperCase();
                if (!["JPEG", "JPG", "PNG"].includes(ext)) {
                    return new ApolloError("This file is not image", "INVALID_LOGO");
                }
                logoFileName = `${UUID()}.${ext}`;
                const pathName = path.join(__dirname, `./../uploads/${logoFileName}`);
                const stream = file.createReadStream();
                await stream.pipe(createWriteStream(pathName));
            }

            try {
                const result = await db.transaction(async (t) => {
                    const teamPayload = { ...team };
                    delete teamPayload.logo;
                    const newTeam = await Team.create(
                        { ...teamPayload, logo: logoFileName },
                        { transaction: t }
                    );

                    const newPerson = await Person.create(manager.person, { transaction: t });

                    const newMember = await Members.create({
                        occupation: manager.occupation || "مدير الفريق",
                        classification: manager.classification || "manager",
                        // MySQL refuses empty strings on DATE/DATETIME columns.
                        membership_date: manager.membership_date && manager.membership_date !== "" ? manager.membership_date : null,
                        membership_date_end: manager.membership_date_end && manager.membership_date_end !== "" ? manager.membership_date_end : null,
                        id_team: newTeam.id,
                        id_person: newPerson.id,
                    }, { transaction: t });

                    const password = await hashPassword(manager.password);
                    const newUser = await User.create({
                        email: manager.email,
                        password,
                        role: "3",
                        activation: true,
                        email_verify: true,
                        id_person: newPerson.id,
                    }, { transaction: t });

                    const fullGrant = "1,2,3,4,5,6,7,8,9,10";
                    await Permission.create({
                        teams: fullGrant, members: fullGrant, technicals: fullGrant,
                        players: fullGrant, transfer_players: fullGrant, loan_players: fullGrant,
                        assembly: fullGrant, inbox: fullGrant, outbox: fullGrant,
                        meeting: fullGrant, blogs: fullGrant, forms: fullGrant,
                        permissions: fullGrant, complaints: fullGrant, expenses: fullGrant,
                        leagues: fullGrant, id_user: newUser.id,
                    }, { transaction: t });

                    return newTeam;
                });
                return result;
            } catch (error) {
                logger.error(`createTeamWithAdmin error: ${error.message}`);
                throw new ApolloError(error);
            }
        },

        updateTeam: async (obj, {id, content}, context, info) =>  {
            if ("enableAddPlayer" in content) {
                CreateNotificationTeam("teamUpdateAdd",content?.enableAddPlayer,id,"")
            }
            if ("account_status" in content) {
                CreateNotificationTeam("teamUpdateStatus",content?.account_status,id,"")
            }
            
            try {
                let logo = null
                if ("logo" in content) {
                    if (content.logo !== null && content.logo !== undefined) {
                        logo = await content.logo
                    }
                    delete content.logo
                }
                
                let result = await Team.update({...content}, { where: { id } })


                if (logo && logo !== null && logo !== undefined) {
                    const listType = ["JPEG", "JPG", "PNG"]

                    const { createReadStream, filename, mimetype, encoding } = await logo;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    const imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Team.update({logo: imgUniqName}, { where: { id } })
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteTeam: async (obj, {id}, context, info) =>  {
            try {
                const team = await Team.destroy({ where: { id } })

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
