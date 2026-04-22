import { ApolloError } from 'apollo-server-express';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {
    Team, League, Match, ParticipatingTeams, MatchCard, ParticipatingPlayers,
    Players, ParticipatingTechnicalStaff, TechnicalApparatus, ScorerMatch, Club
} from '../../Models/index.mjs';
import {assertCanAccessClub, assertCanAccessPlayer, assertCanAccessTeam} from "../../Helpers/Authorization.mjs";

dotenv.config();

const assertCanAccessLeagueById = async (context, idLeague) => {
    if (!idLeague) return null;

    const league = await League.findByPk(idLeague);
    await assertCanAccessClub(context, league?.id_club);

    return league;
}

const assertCanAccessParticipatingTeamById = async (context, idParticipatingTeam) => {
    if (!idParticipatingTeam) return null;

    const participatingTeam = await ParticipatingTeams.findByPk(idParticipatingTeam);
    await assertCanAccessLeagueById(context, participatingTeam?.id_league);
    await assertCanAccessTeam(context, participatingTeam?.id_team);

    return participatingTeam;
}

const assertCanAccessMatchById = async (context, idMatch) => {
    if (!idMatch) return null;

    const match = await Match.findByPk(idMatch);
    await assertCanAccessLeagueById(context, match?.id_league);
    await assertCanAccessParticipatingTeamById(context, match?.first_team);
    await assertCanAccessParticipatingTeamById(context, match?.second_team);

    return match;
}

const assertCanAccessParticipatingPlayerById = async (context, idParticipatingPlayer) => {
    if (!idParticipatingPlayer) return null;

    const participatingPlayer = await ParticipatingPlayers.findByPk(idParticipatingPlayer);
    await assertCanAccessParticipatingTeamById(context, participatingPlayer?.id_participating_team);
    await assertCanAccessPlayer(context, participatingPlayer?.id_player);

    return participatingPlayer;
}

const assertCanAccessParticipatingTechnicalStaffById = async (context, idParticipatingTechnicalStaff) => {
    if (!idParticipatingTechnicalStaff) return null;

    const participatingTechnicalStaff = await ParticipatingTechnicalStaff.findByPk(idParticipatingTechnicalStaff);
    await assertCanAccessParticipatingTeamById(context, participatingTechnicalStaff?.id_participating_team);
    await assertCanAccessTechnicalApparatusById(context, participatingTechnicalStaff?.id_technical_apparatus);

    return participatingTechnicalStaff;
}

const assertCanAccessTechnicalApparatusById = async (context, idTechnicalApparatus) => {
    if (!idTechnicalApparatus) return null;

    const technicalApparatus = await TechnicalApparatus.findByPk(idTechnicalApparatus);
    await assertCanAccessTeam(context, technicalApparatus?.id_team);

    return technicalApparatus;
}

const assertCanAccessScorerMatchById = async (context, idScorerMatch) => {
    if (!idScorerMatch) return null;

    const scorerMatch = await ScorerMatch.findByPk(idScorerMatch);
    await assertCanAccessMatchById(context, scorerMatch?.id_match);
    await assertCanAccessParticipatingTeamById(context, scorerMatch?.id_participating_team);
    await assertCanAccessParticipatingPlayerById(context, scorerMatch?.id_participating_player);

    return scorerMatch;
}

export const resolvers = {
    Query: {
        league: async (obj, {id}, context, info) =>  {
            try {
                const league = await assertCanAccessLeagueById(context, id)

                return league
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allLeagues: async (obj, {idClub}, context, info) =>  {
            try {
                await assertCanAccessClub(context, idClub);

                return await League.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allParticipatingPlayers: async (obj, {idParticipatingTeams}, context, info) =>  {
            try {
                await assertCanAccessParticipatingTeamById(context, idParticipatingTeams);

                return await ParticipatingPlayers.findAll({
                    where: {
                        id_participating_team: idParticipatingTeams
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allParticipatingTechnicalStaff: async (obj, {idParticipatingTeams}, context, info) =>  {
            try {
                await assertCanAccessParticipatingTeamById(context, idParticipatingTeams);

                return await ParticipatingTechnicalStaff.findAll({
                    where: {
                        id_participating_team: idParticipatingTeams
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
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
                await assertCanAccessClub(context, content.id_club);

                return await League.create({
                    ...content
                })

            } catch (error) {
                if (error instanceof ApolloError) throw error;
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateLeague: async (obj, {id, content}, context, info) =>  {
            try {
                const league = await assertCanAccessLeagueById(context, id);
                if (!league) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessClub(context, content.id_club);

                let result = await League.update({
                    ...content
                }, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteLeague: async (obj, {id}, context, info) =>  {
            try {
                const leagueCurrent = await assertCanAccessLeagueById(context, id);
                if (!leagueCurrent) {
                    return {
                        status: false
                    }
                }

                const league = await League.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },


        createParticipatingTeams: async (obj, {content}, context, info) =>  {
            try {
                for (const row of content) {
                    await assertCanAccessLeagueById(context, row.id_league);
                    await assertCanAccessTeam(context, row.id_team);
                }

                return await ParticipatingTeams.bulkCreate(content)

            } catch (error) {
                if (error instanceof ApolloError) throw error;
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

                        await assertCanAccessParticipatingTeamById(context, id);
                        await assertCanAccessLeagueById(context, row.id_league);
                        await assertCanAccessTeam(context, row.id_team);

                        let resultRow = await ParticipatingTeams.update({...row}, { where: { id } })
                        result = resultRow[0] === 1 ? result + 1 : result
                    } else {
                        await assertCanAccessLeagueById(context, row.id_league);
                        await assertCanAccessTeam(context, row.id_team);

                        await ParticipatingTeams.create(row)
                    }
                }

                return {
                    status: result[0] >= 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteParticipatingTeams: async (obj, {id}, context, info) =>  {
            try {
                const participatingTeam = await assertCanAccessParticipatingTeamById(context, id);
                if (!participatingTeam) {
                    return {
                        status: false
                    }
                }

                const league = await ParticipatingTeams.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createMatch: async (obj, {content}, context, info) =>  {
            try {
                await assertCanAccessLeagueById(context, content.id_league);
                await assertCanAccessParticipatingTeamById(context, content.first_team);
                await assertCanAccessParticipatingTeamById(context, content.second_team);

                return await Match.create({...content})

            } catch (error) {
                if (error instanceof ApolloError) throw error;
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateMatch: async (obj, {id, content}, context, info) =>  {
            try {
                const match = await assertCanAccessMatchById(context, id);
                if (!match) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessLeagueById(context, content.id_league);
                await assertCanAccessParticipatingTeamById(context, content.first_team);
                await assertCanAccessParticipatingTeamById(context, content.second_team);

                let result = await Match.update({...content}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteMatch: async (obj, {id}, context, info) =>  {
            try {
                const match = await assertCanAccessMatchById(context, id);
                if (!match) {
                    return {
                        status: false
                    }
                }

                const league = await Match.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createMatchCard: async (obj, {content}, context, info) =>  {
            try {
                await assertCanAccessMatchById(context, content.id_match);
                await assertCanAccessParticipatingTeamById(context, content.id_team);

                return await MatchCard.create({...content})

            } catch (error) {
                if (error instanceof ApolloError) throw error;
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateMatchCard: async (obj, {id, content}, context, info) =>  {
            try {
                const matchCard = await MatchCard.findByPk(id);
                if (!matchCard) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessMatchById(context, matchCard.id_match);
                await assertCanAccessParticipatingTeamById(context, matchCard.id_team);
                await assertCanAccessMatchById(context, content.id_match);
                await assertCanAccessParticipatingTeamById(context, content.id_team);

                let result = await MatchCard.update({...content}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteMatchCard: async (obj, {id}, context, info) =>  {
            try {
                const matchCard = await MatchCard.findByPk(id);
                if (!matchCard) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessMatchById(context, matchCard.id_match);
                await assertCanAccessParticipatingTeamById(context, matchCard.id_team);

                const league = await MatchCard.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createParticipatingPlayers: async (obj, {content}, context, info) =>  {
            try {
                for (const row of content) {
                    await assertCanAccessParticipatingTeamById(context, row.id_participating_team);
                    await assertCanAccessPlayer(context, row.id_player);
                }

                return await ParticipatingPlayers.bulkCreate(content)

            } catch (error) {
                if (error instanceof ApolloError) throw error;
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

                        await assertCanAccessParticipatingPlayerById(context, id);
                        await assertCanAccessParticipatingTeamById(context, row.id_participating_team);
                        await assertCanAccessPlayer(context, row.id_player);

                        let resultRow = await ParticipatingPlayers.update({...row}, { where: { id } })
                        result = resultRow[0] === 1 ? result + 1 : result
                    } else {
                        await assertCanAccessParticipatingTeamById(context, row.id_participating_team);
                        await assertCanAccessPlayer(context, row.id_player);

                        await ParticipatingPlayers.create(row)
                    }
                }

                return {
                    status: result[0] >= 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteParticipatingPlayers: async (obj, {id}, context, info) =>  {
            try {
                const participatingPlayer = await assertCanAccessParticipatingPlayerById(context, id);
                if (!participatingPlayer) {
                    return {
                        status: false
                    }
                }

                const result = await ParticipatingPlayers.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createParticipatingTechnicalStaff: async (obj, {content}, context, info) =>  {
            try {
                for (const row of content) {
                    await assertCanAccessParticipatingTeamById(context, row.id_participating_team);
                    await assertCanAccessTechnicalApparatusById(context, row.id_technical_apparatus);
                }

                return await ParticipatingTechnicalStaff.bulkCreate(content)

            } catch (error) {
                if (error instanceof ApolloError) throw error;
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

                        await assertCanAccessParticipatingTechnicalStaffById(context, id);
                        await assertCanAccessParticipatingTeamById(context, row.id_participating_team);
                        await assertCanAccessTechnicalApparatusById(context, row.id_technical_apparatus);

                        let resultRow = await ParticipatingTechnicalStaff.update({...row}, { where: { id } })
                        result = resultRow[0] === 1 ? result + 1 : result
                    } else {
                        await assertCanAccessParticipatingTeamById(context, row.id_participating_team);
                        await assertCanAccessTechnicalApparatusById(context, row.id_technical_apparatus);

                        await ParticipatingTechnicalStaff.create(row)
                    }
                }

                return {
                    status: result[0] >= 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteParticipatingTechnicalStaff: async (obj, {id}, context, info) =>  {
            try {
                const participatingTechnicalStaff = await assertCanAccessParticipatingTechnicalStaffById(context, id);
                if (!participatingTechnicalStaff) {
                    return {
                        status: false
                    }
                }

                const result = await ParticipatingTechnicalStaff.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createScorerMatch: async (obj, {content}, context, info) =>  {
            try {
                await assertCanAccessMatchById(context, content.id_match);
                await assertCanAccessParticipatingTeamById(context, content.id_participating_team);
                await assertCanAccessParticipatingPlayerById(context, content.id_participating_player);

                return await ScorerMatch.create(content)

            } catch (error) {
                if (error instanceof ApolloError) throw error;
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

                        await assertCanAccessScorerMatchById(context, id);
                        await assertCanAccessMatchById(context, row.id_match);
                        await assertCanAccessParticipatingTeamById(context, row.id_participating_team);
                        await assertCanAccessParticipatingPlayerById(context, row.id_participating_player);

                        let resultRow = await ScorerMatch.update({...row}, { where: { id } })
                        result = resultRow[0] === 1 ? result + 1 : result
                    } else {
                        await assertCanAccessMatchById(context, row.id_match);
                        await assertCanAccessParticipatingTeamById(context, row.id_participating_team);
                        await assertCanAccessParticipatingPlayerById(context, row.id_participating_player);

                        await ScorerMatch.create(row)
                    }
                }

                console.log({result});

                return {
                    status: result[0] >= 1
                }

            } catch (error) {
                if (error instanceof ApolloError) throw error;
                throw new ApolloError(error)
            }
        }
    }
}
