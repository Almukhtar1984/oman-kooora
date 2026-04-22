import { ApolloError } from 'apollo-server-express';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {
    Team, League, Match, ParticipatingTeams, MatchCard, ParticipatingPlayers,
    Players, ParticipatingTechnicalStaff, TechnicalApparatus, ScorerMatch, Club
} from '../../Models/index.mjs';

dotenv.config();

export const resolvers = {
    Query: {
        league: async (obj, {id}, context, info) =>  {
            try {
                return await League.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allLeagues: async (obj, {idClub}, context, info) =>  {
            try {
                return await League.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allParticipatingPlayers: async (obj, {idParticipatingTeams}, context, info) =>  {
            try {
                return await ParticipatingPlayers.findAll({
                    where: {
                        id_participating_team: idParticipatingTeams
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allParticipatingTechnicalStaff: async (obj, {idParticipatingTeams}, context, info) =>  {
            try {
                return await ParticipatingTechnicalStaff.findAll({
                    where: {
                        id_participating_team: idParticipatingTeams
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allScorerMatch: async (obj, {idMatch}, context, info) =>  {
            try {
                return await ScorerMatch.findAll({
                    where: {
                        id_match: idMatch
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    League: {
        participatingTeams: async ({id}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findAll({
                    where: {id_league: id}
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        matchs: async ({id}, {}, context, info) =>  {
            try {
                return await Match.findAll({
                    where: {id_league: id}
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        club: async ({id_club}, {}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    ParticipatingTeams: {
        league: async ({id_league}, {}, context, info) =>  {
            try {
                return await League.findByPk(id_league)
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

    Match: {
        firstTeam: async ({first_team}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findByPk(first_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        
        secondTeam: async ({second_team}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findByPk(second_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        firstTeamCards: async ({first_team}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findAll({
                    where: {
                        id_team: first_team
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        secondTeamCards: async ({second_team}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findAll({
                    where: {
                        id_team: second_team
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        firstTeamScorersMatch: async ({id, first_team}, {}, context, info) =>  {
            try {
                return await ScorerMatch.findAll({
                    where: {
                        id_match: id,
                        id_participating_team: first_team
                    }
                })
                
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        secondTeamScorersMatch: async ({id, second_team}, {}, context, info) =>  {
            try {
                return await ScorerMatch.findAll({
                    where: {
                        id_match: id,
                        id_participating_team: second_team
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    MatchCard: {
        team: async ({id_team}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findByPk(id_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        match: async ({id_match}, {}, context, info) =>  {
            try {
                return await Match.findByPk(id_match)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    ParticipatingPlayers: {
        participating_team: async ({id_participating_team}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findByPk(id_participating_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        player: async ({id_player}, {}, context, info) =>  {
            try {
                return await Players.findByPk(id_player)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    ParticipatingTechnicalStaff: {
        participating_team: async ({id_participating_team}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findByPk(id_participating_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        technicalApparatus: async ({id_technical_apparatus}, {}, context, info) =>  {
            try {
                return await TechnicalApparatus.findByPk(id_technical_apparatus)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    ScorerMatch: {
        match: async ({id_match}, {}, context, info) =>  {
            try {
                return await Match.findByPk(id_match)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        participating_team: async ({id_participating_team}, {}, context, info) =>  {
            try {
                return await ParticipatingTeams.findByPk(id_participating_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        participating_player: async ({id_participating_player}, {}, context, info) =>  {
            try {
                return await ParticipatingPlayers.findByPk(id_participating_player)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
        createLeague: async (obj, {content}, context, info) =>  {
            try {
                return await League.create({
                    ...content
                })

            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateLeague: async (obj, {id, content}, context, info) =>  {
            try {
                let result = await League.update({
                    ...content
                }, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteLeague: async (obj, {id}, context, info) =>  {
            try {
                const league = await League.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },


        createParticipatingTeams: async (obj, {content}, context, info) =>  {
            try {
                return await ParticipatingTeams.bulkCreate(content)

            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateParticipatingTeams: async (obj, {id, content}, context, info) =>  {
            try {
                let result = 0

                for (let i = 0; i < content.length; i++) {
                    const row = content[i]

                    if (row.id && row.id !== "") {
                        const id = row.id
                        delete row.id

                        let resultRow = await ParticipatingTeams.update({...row}, { where: { id } })
                        result = resultRow[0] === 1 ? result + 1 : result
                    } else {
                        await ParticipatingTeams.create(row)
                    }
                }

                return {
                    status: result[0] >= 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteParticipatingTeams: async (obj, {id}, context, info) =>  {
            try {
                const league = await ParticipatingTeams.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createMatch: async (obj, {content}, context, info) =>  {
            try {
                return await Match.create({...content})

            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateMatch: async (obj, {id, content}, context, info) =>  {
            try {
                let result = await Match.update({...content}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteMatch: async (obj, {id}, context, info) =>  {
            try {
                const league = await Match.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createMatchCard: async (obj, {content}, context, info) =>  {
            try {
                return await MatchCard.create({...content})

            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateMatchCard: async (obj, {id, content}, context, info) =>  {
            try {
                let result = await MatchCard.update({...content}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteMatchCard: async (obj, {id}, context, info) =>  {
            try {
                const league = await MatchCard.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createParticipatingPlayers: async (obj, {content}, context, info) =>  {
            try {
                return await ParticipatingPlayers.bulkCreate(content)

            } catch (error) {
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateParticipatingPlayers: async (obj, {content}, context, info) =>  {
            try {
                let result = 0

                for (let i = 0; i < content.length; i++) {
                    const row = content[i]

                    if (row.id && row.id !== "") {
                        const id = row.id
                        delete row.id

                        let resultRow = await ParticipatingPlayers.update({...row}, { where: { id } })
                        result = resultRow[0] === 1 ? result + 1 : result
                    } else {
                        await ParticipatingPlayers.create(row)
                    }
                }

                return {
                    status: result[0] >= 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteParticipatingPlayers: async (obj, {id}, context, info) =>  {
            try {
                const result = await ParticipatingPlayers.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createParticipatingTechnicalStaff: async (obj, {content}, context, info) =>  {
            try {
                return await ParticipatingTechnicalStaff.bulkCreate(content)

            } catch (error) {
                throw new ApolloError(error)
            }
        },
        updateParticipatingTechnicalStaff: async (obj, {content}, context, info) =>  {
            try {
                let result = 0

                for (let i = 0; i < content.length; i++) {
                    const row = content[i]

                    if (row.id && row.id !== "") {
                        const id = row.id
                        delete row.id

                        let resultRow = await ParticipatingTechnicalStaff.update({...row}, { where: { id } })
                        result = resultRow[0] === 1 ? result + 1 : result
                    } else {
                        await ParticipatingTechnicalStaff.create(row)
                    }
                }

                return {
                    status: result[0] >= 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteParticipatingTechnicalStaff: async (obj, {id}, context, info) =>  {
            try {
                const result = await ParticipatingTechnicalStaff.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createScorerMatch: async (obj, {content}, context, info) =>  {
            try {
                return await ScorerMatch.create(content)

            } catch (error) {
                throw new ApolloError(error)
            }
        },
        updateScorerMatch: async (obj, {content}, context, info) =>  {
            try {
                let result = 0

                for (let i = 0; i < content.length; i++) {
                    const row = content[i]

                    if (row.id && row.id !== "") {
                        const id = row.id
                        delete row.id

                        let resultRow = await ScorerMatch.update({...row}, { where: { id } })
                        result = resultRow[0] === 1 ? result + 1 : result
                    } else {
                        await ScorerMatch.create(row)
                    }
                }

                console.log({result});

                return {
                    status: result[0] >= 1
                }

            } catch (error) {
                throw new ApolloError(error)
            }
        }
    }
}
