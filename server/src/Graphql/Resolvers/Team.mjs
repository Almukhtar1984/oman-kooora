import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Club, Members, Person, Players, Team, User,TechnicalApparatus, Stadium} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


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

        updateTeam: async (obj, {id, content}, context, info) =>  {
            try {
                let result = await Team.update({...content}, { where: { id } })


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
