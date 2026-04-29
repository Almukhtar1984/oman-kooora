import { ApolloError } from 'apollo-server-express';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";
import { Op } from 'sequelize';
import {
    Team, League, Match, ParticipatingTeams, MatchCard, ParticipatingPlayers,ParticipatingPlayersMatch,
    Players, ParticipatingTechnicalStaff, TechnicalApparatus, ScorerMatch, Club, Arbitres,Person,Penalty
} from '../../Models/index.mjs';


dotenv.config();

export const resolvers = {
    Query: {
        GetParticipatingPlayer: async (_, { id }, context) => {
            try {
                const player = await ParticipatingPlayers.findByPk(id, {
                    include: [
                        {
                            model: Players,
                            as: 'player'
                        },
                        {
                            model: ParticipatingTeams,
                            as: 'participating_team',
                            include: [
                                {
                                    model: Team,
                                    as: 'team'
                                }
                            ]
                        }
                    ]
                });

                if (!player) {
                    throw new ApolloError("Participating Player not found");
                }

                return player;
            } catch (error) {
                console.error("Error fetching Participating Player:", error);
                throw new ApolloError(error.message);
            }
        },
        GetParticipatingStaff: async (_, { id }) => {
            try {
                const staff = await ParticipatingTechnicalStaff.findByPk(id, {
                    include: [
                        {
                            model: TechnicalApparatus,
                            include: [Person] // assuming this is how Person is related
                        },
                        {
                            model: ParticipatingTeams,
                            as: 'participating_team',
                            include: [
                                {
                                    model: Team,
                                    as: 'team'
                                }
                            ]
                        }
                    ]
                });
        
                if (!staff) {
                    throw new ApolloError("Participating Technical Staff not found");
                }
        
                return staff;
            } catch (error) {
                console.error("Error fetching Participating Technical Staff:", error);
                throw new ApolloError(error.message);
            }
        },

   
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
        leagueFull: async (obj, { id }, context, info) => {
            try {
                return await League.findByPk(id, {
                    include: [
                        {
                            model: ParticipatingTeams,
                            include: [
                                {
                                    model: Team,
                                    as: 'team'
                                },
                                {
                                    model: ParticipatingPlayers,
                                    include: [
                                        {
                                            model: ParticipatingPlayersMatch,
                                            include: ['match']
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            model: Match,
                            include: [
                                {
                                    model: ParticipatingTeams,
                                    as: 'firstTeam',
                                    include: ['team']
                                },
                                {
                                    model: ParticipatingTeams,
                                    as: 'secondTeam',
                                    include: ['team']
                                }
                            ]
                        },
                        {
                            model: Club,
                            as: 'club'
                        }
                    ]
                });
            } catch (error) {
                logger.error(`Error fetching league by ID ${id}: ${error.message}`);
                throw new ApolloError('Failed to fetch league. Please try again later.');
            }
        },
        allLeaguesExternal: async () => {
            try {
                return await League.findAll();
            } catch (error) {
                logger.error(error.message);
                throw new ApolloError(error);
            }
        },
        allLeaguesTeam: async (obj, { idTeam }, context, info) => {
           
            try {
                //Fetch participating teams and include the associated leagues
                const participatingTeams = await ParticipatingTeams.findAll({
                    where: {
                        id_team: idTeam
                    },
                    include: [{
                        model: League,
                        as: 'league'  // Ensure this alias matches the one used in your association if any
                    }]
                });
        
                
        
                // Extract leagues from participating teams and log them
                const leagues = participatingTeams.map(pt => {
                    return pt.league; // Ensure this is correctly accessing the league data
                });
        
                // Filter out null leagues (if any) and log the final leagues
                const filteredLeagues = leagues.filter(league => league !== null);
                // Return the list of leagues
                return filteredLeagues;
            } catch (error) {
                console.error("Error in allLeaguesTeam resolver:", error); // Log any error encountered
                throw new ApolloError(error);
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
        getMatch: async (obj, { id }, context, info) => {
            try {
                const match = await Match.findByPk(id);
        
                if (!match) {
                    throw new ApolloError("Match not found");
                }
        
                const league = await League.findByPk(match.id_league);
        
                return {
                    ...match.dataValues,
                    league
                };
            } catch (error) {
                logger.error("Error fetching match:", error.message);
                throw new ApolloError(error.message);
            }
        },
        calculatePoints: async (_, { leagueId }) => {
              // Fetch the league by ID
              const league = await League.findByPk(leagueId);
            
              if (!league) {
                throw new Error('League not found');
              }
            
              // Fetch all matches for the league
              const matches = await Match.findAll({
                where: { id_league: leagueId, type: "groups" ,matchState: { [Op.in]: ["end", "playing"] }}
              });
            
              // Fetch all participating teams for the league
              const participatingTeams = await ParticipatingTeams.findAll({
                where: { id_league: leagueId }
              });
            
              // Initialize a map to store stats for each team
              const teamStats = new Map();
            
              // Initialize stats for all teams
              for (const team of participatingTeams) {
                teamStats.set(team.id, {
                  points: 0,
                  matchesPlayed: 0,
                  wins: 0,
                  losses: 0,
                  draws: 0,
                  goalsScored: 0,        // goals for
                  goalsAgainst: 0,       // goals against
                  group: team.group
                });
              }
            
              // Iterate over the matches
              for (const match of matches) {
                if (match.firstTeamGoal === null || match.secondTeamGoal === null) {
                  continue;
                }
            
                // Fetch participating teams for the match
                const firstTeam = await ParticipatingTeams.findByPk(match.first_team);
                const secondTeam = await ParticipatingTeams.findByPk(match.second_team);
            
                const firstTeamId = firstTeam.id;
                const secondTeamId = secondTeam.id;
            
                const firstStats = teamStats.get(firstTeamId);
                const secondStats = teamStats.get(secondTeamId);
            
                // Update matches played
                firstStats.matchesPlayed += 1;
                secondStats.matchesPlayed += 1;
            
                // Update goals
                firstStats.goalsScored += match.firstTeamGoal;
                firstStats.goalsAgainst += match.secondTeamGoal;
            
                secondStats.goalsScored += match.secondTeamGoal;
                secondStats.goalsAgainst += match.firstTeamGoal;
            
                // Update points and win/loss/draw stats
                if (match.firstTeamGoal > match.secondTeamGoal) {
                  // First team wins
                  firstStats.points += 3;
                  firstStats.wins += 1;
                  secondStats.losses += 1;
                } else if (match.firstTeamGoal < match.secondTeamGoal) {
                  // Second team wins
                  secondStats.points += 3;
                  secondStats.wins += 1;
                  firstStats.losses += 1;
                } else {
                  // Draw
                  firstStats.points += 1;
                  secondStats.points += 1;
                  firstStats.draws += 1;
                  secondStats.draws += 1;
                }
              }
            
              // Convert the map to an array of objects
              const statsArray = [];
              for (const [teamId, stats] of teamStats.entries()) {
                const teamP = await ParticipatingTeams.findByPk(teamId);
            
                const team = await Team.findOne({
                  where: { id: teamP.id_team }
                });
            
                statsArray.push({
                  team,
                  points: stats.points,
                  matchesPlayed: stats.matchesPlayed,
                  wins: stats.wins,
                  losses: stats.losses,
                  draws: stats.draws,
                  goalsFor: stats.goalsScored,
                  goalsAgainst: stats.goalsAgainst,
                  goalDifference: stats.goalsScored - stats.goalsAgainst||0,
                  group: teamP.group
                });
              }
            
              return statsArray;
            }
            ,
          
        
        calculateGoalPlayer: async (_, { leagueId }) => {
            // Fetch all matches for the league
            const TeamsWithScorers = await ParticipatingTeams.findAll({
                where: { id_league: leagueId },
                include: [{
                    model: ScorerMatch
                }]
            });
        
            const GoalStats = new Map();
        
            TeamsWithScorers.forEach(team => {
                // Ensure there is at least one scorer match
                if (team.scorer_match) {
                    // Convert scorer_match to an array if it's not already
                    const scorerMatches = Array.isArray(team.scorer_match) ? team.scorer_match : [team.scorer_match];
                    scorerMatches.forEach(match => {
                        const playerId = match.id_participating_player;
                        const goals = 1; // Assuming `time` represents the goal count
        
                        if (GoalStats.has(playerId)) {
                            GoalStats.set(playerId, GoalStats.get(playerId) + goals);
                        } else {
                            GoalStats.set(playerId, goals);
                        }
                    });
                }
            });
        
            // Convert the map to an array of objects and sort by goals
            const sortedPlayers = Array.from(GoalStats.entries())
                .map(([playerId, goals]) => ({ playerId, goals }))
                .sort((a, b) => b.goals - a.goals);
        
            // Fetch additional details for each player
            
            const detailedPlayers = await Promise.all(sortedPlayers.map(async (player) => {
                const participatingPlayer = await ParticipatingPlayers.findByPk(player.playerId, {
                    include: [{
                        model: Players,
                        as: 'player',
                        include: [
                            {
                            model: Person,
                            as: 'person'
                            }
                        ]
                    }, {
                        model: ParticipatingTeams,
                        as: 'participating_team',
                        include: [{
                            model: Team,
                            as: 'team'
                        }]
                    }]
                });

                if (!participatingPlayer || !participatingPlayer.player || !participatingPlayer.participating_team) {
                    console.warn("Missing data for playerId:", player.playerId);
                    return null;
                }
                return {
                    PlayerID: participatingPlayer || "",
                    Goal: player?.goals || "",
                    team: participatingPlayer?.participating_team.team.name || ""
                };
            }));
            return detailedPlayers;
        },

        ExternalMatch: async (_, { id }, context) => {
           
            try {
                const match = await Match.findByPk(id);
                if (!match) {
                    throw new ApolloError("Match not found");
                }

                return {
                    ...match.dataValues,
                    league: await League.findByPk(match.id_league),
                };
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },

        getCardsByLeague: async (_, { leagueId }) => {
            try {
              // Step 1: Get match IDs in the league
              const matches = await Match.findAll({
                where: { id_league: leagueId },
                attributes: ['id']
              });
              const matchIds = matches.map(match => match.id);
          
              if (!matchIds.length) return { yellowCards: [], redCards: [] };
          
              // Step 2: Fetch all MatchCards for those matches
              const cards = await MatchCard.findAll({
                where: {
                  id_match: matchIds
                }
              });
          
              // Step 3: Aggregate card counts per player
              const yellowMap = new Map();
              const redMap = new Map();
          
              for (const card of cards) {
                const key = card.id_player;
                const playerName = card.player;
                const team = await ParticipatingTeams.findByPk(card.id_team);
                const participatingPlayer = await ParticipatingPlayers.findOne({
                  where: {
                    id_player: card.id_player,
                    id_participating_team: card.id_team
                  }
                });
          
                const number = participatingPlayer?.number || "";
          
                if (card.type === "red") {
                  if (!redMap.has(key)) {
                    redMap.set(key, {
                      player: playerName,
                      number,
                      count: 1,
                      team: await Team.findByPk(team.id_team)
                    });
                  } else {
                    redMap.get(key).count++;
                  }
                } else if (card.type === "yellow") {
                  // Only add if not already in red
                  if (!redMap.has(key)) {
                    if (!yellowMap.has(key)) {
                      yellowMap.set(key, {
                        player: playerName,
                        number,
                        count: 1,
                        team: await Team.findByPk(team.id_team)
                      });
                    } else {
                      yellowMap.get(key).count++;
                    }
                  }
                }
              }
          
              return {
                yellowCards: Array.from(yellowMap.values()),
                redCards: Array.from(redMap.values())
              };
            } catch (error) {
              console.error("getCardsByLeague error:", error);
              throw new ApolloError("Failed to fetch grouped match cards.");
            }
          },

        countExternalPlayers: async (_, { idTeam, idLeague }) => {
            try {
              const team = await ParticipatingTeams.findOne({
                where: { id_team: idTeam, id_league: idLeague }
              });
          
              if (!team) return 0;
          
              const count = await ParticipatingPlayers.count({
                where: {
                  id_participating_team: team.id
                },
                include: [{
                  model: Players,
                  as: "player",
                  where: { type: "external" }
                }]
              });
          
              return count;
            } catch (error) {
              console.error("Error counting external players:", error);
              throw new ApolloError("Failed to count external players");
            }
          },
          
        getAllMatchesGroupedByType: async (_, { leagueId }) => {
        try {
            const matches = await Match.findAll({
            where: { id_league: leagueId },
            order: [['type', 'ASC'], ['date', 'ASC']],
            include: [
                {
                model: ParticipatingTeams,
                as: 'firstTeam',
                include: [{ model: Team, as: 'team' }]
                },
                {
                model: ParticipatingTeams,
                as: 'secondTeam',
                include: [{ model: Team, as: 'team' }]
                },
                {
                model: League,
                as: 'league'
                }
            ]
            });

            const grouped = matches.reduce((acc, match) => {
            const key = match.type || 'unknown';
            if (!acc[key]) acc[key] = [];
            acc[key].push(match);
            return acc;
            }, {});

            return Object.entries(grouped).map(([type, matches]) => ({
            type,
            matches
            }));
        } catch (error) {
            console.error("Error in getAllMatchesGroupedByType:", error);
            throw new ApolloError("Failed to fetch grouped matches");
        }
        },

        
        
        getCardsByLeagueGroupedByMatchType: async (_, { leagueId }) => {
  
        try {

            const matches = await Match.findAll({
            where: { id_league: leagueId },
            attributes: ['id', 'type'],
            });


            const matchMap = new Map();
            matches.forEach((match) => {
            matchMap.set(match.id, match.type || "unknown");
            });

            const matchIds = matches.map((m) => m.id);
            if (!matchIds.length) {
            return [];
            }

            const cards = await MatchCard.findAll({
            where: { id_match: matchIds },
            });


            const groupedByType = {};

            for (const card of cards) {
            const type = matchMap.get(card.id_match) || "unknown";
            const key = `${card.id_player}-${card.id_team}`;
            const team = await ParticipatingTeams.findByPk(card.id_team);
            const teamData = await Team.findByPk(team?.id_team);
            const playerName = card.player;

            const participatingPlayer = await ParticipatingPlayers.findOne({
                where: {
                id_player: card.id_player,
                id_participating_team: card.id_team,
                },
            });

            const number = participatingPlayer?.number || "";

            if (!groupedByType[type]) {
                groupedByType[type] = {
                yellowCards: new Map(),
                redCards: new Map(),
                };
            }

            const yellowMap = groupedByType[type].yellowCards;
            const redMap = groupedByType[type].redCards;

            if (card.type === "red") {
                if (!redMap.has(key)) {
                redMap.set(key, {
                    player: playerName,
                    number,
                    count: 1,
                    team: teamData,
                });
                } else {
                redMap.get(key).count++;
                }
            } else if (card.type === "yellow") {
                if (!redMap.has(key)) {
                if (!yellowMap.has(key)) {
                    yellowMap.set(key, {
                    player: playerName,
                    number,
                    count: 1,
                    team: teamData,
                    });
                } else {
                    yellowMap.get(key).count++;
                }
                }
            }
            }

            const finalResult = Object.entries(groupedByType).map(([type, { yellowCards, redCards }]) => ({
            type,
            yellowCards: Array.from(yellowCards.values()),
            redCards: Array.from(redCards.values()),
            }));


            return finalResult;

        } catch (error) {
            console.error("❌ getCardsByLeagueGroupedByMatchType error:", error);
            throw new ApolloError("Failed to fetch grouped match cards.");
        }
        }


        
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
                    where: {id_league: id},
                order: [['createdAt', 'DESC']],
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
        participatingPlayers: async ({id}, {}, context, info) =>  {
        
            try {
                
                return await ParticipatingPlayers.findAll({
                    where: {id_participating_team: id}
                })
            } catch (error) {
                logger.error("nami")
                throw new ApolloError(error)
            }
        },
        participatingTechnicalStaff: async ({ id }, {}, context, info) => {
            try {
            
              return await ParticipatingTechnicalStaff.findAll({
                where: { id_participating_team: id },
                include: [
                  {
                    model: TechnicalApparatus, // ✅ no alias here
                    include: [Person],         // ✅ include the actual model, not string "person"
                  },
                ],
              });
            } catch (error) {
                console.log("error",error)
              logger.error("Failed to fetch technical staff");
              throw new ApolloError(error);
            }
          },
          
        
    },

    Match: {
        // Fetch first team using both match.id_league and match.first_team (id_team)
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
      
        // Cards for the first team using id_match and id_team
        firstTeamCards: async ({ id, first_team }, {}, context, info) => {
          try {
            return await MatchCard.findAll({
              where: {
                id_match: id,
                id_team: first_team
              }
            });
          } catch (error) {
            throw new ApolloError(error);
          }
        },
      
        // Cards for the second team using id_match and id_team
        secondTeamCards: async ({ id, second_team }, {}, context, info) => {
          try {
            return await MatchCard.findAll({
              where: {
                id_match: id,
                id_team: second_team
              }
            });
          } catch (error) {
            throw new ApolloError(error);
          }
        },
      
        // Scorers for first team
        firstTeamScorersMatch: async ({ id, first_team }, {}, context, info) => {
          try {
            return await ScorerMatch.findAll({
              where: {
                id_match: id,
                id_participating_team: first_team
              }
            });
          } catch (error) {
            throw new ApolloError(error);
          }
        },
      
        // Scorers for second team
        secondTeamScorersMatch: async ({ id, second_team }, {}, context, info) => {
          try {
            return await ScorerMatch.findAll({
              where: {
                id_match: id,
                id_participating_team: second_team
              }
            });
          } catch (error) {
            throw new ApolloError(error);
          }
        },
      
        // Referees
        arbitre: async ({ id }, {}, context, info) => {
          try {
            return await Arbitres.findOne({
              where: { id_match: id }
            });
          } catch (error) {
            throw new ApolloError(error);
          }
        },
      
        // League info
        league: async ({ id_league }) => {
          try {
            return await League.findByPk(id_league);
          } catch (error) {
            throw new ApolloError(error.message);
          }
        },
        firstTeamParticipatingPlayersMatch: async ({ id, first_team }) => {
            try {
              return await ParticipatingPlayersMatch.findAll({
                include: [{
                  model: ParticipatingPlayers,
                  as: 'participating_player', // ✅ correct alias
                  where: {
                    id_participating_team: first_team
                  }
                }],
                where: { id_match: id }
              });
            } catch (error) {
              throw new ApolloError(error.message);
            }
          },
        
        secondTeamParticipatingPlayersMatch: async ({ id, second_team }) => {
            try {
              return await ParticipatingPlayersMatch.findAll({
                include: [{
                  model: ParticipatingPlayers,
                  as: 'participating_player', // ✅ correct alias
                  where: {
                    id_participating_team: second_team
                  }
                }],
                where: { id_match: id }
              });
            } catch (error) {
              throw new ApolloError(error.message);
            }
          },
         penalty: async ({ id }) => {
                try {
                return await Penalty.findOne({ where: { id_match: id } });
                } catch (error) {
                throw new ApolloError(error.message);
                }
            },
            }
      ,
      

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
        participatingPlayersMatches: async ({id}, {}, context, info) =>  {
            
            try {
                
                return await ParticipatingPlayersMatch.findAll({
                    where: {id_participating_player: id}
                })
            } catch (error) {
                logger.error("nami")
                throw new ApolloError(error)
            }
        },
    },

    ParticipatingPlayersMatch: {
        id_match: async (parent, _, { db }) => {
          return await Match.findByPk(parent.id_match);
        },
        id_participating_player: async (parent, _, { db }) => {
          const participatingPlayer = await ParticipatingPlayers.findByPk(parent.id_participating_player);
          if (participatingPlayer) {
            const player = await Players.findByPk(participatingPlayer.id_player);
            return {
              ...participatingPlayer.toJSON(),
              player: player ? player.toJSON() : null
            };
          }
          return null;
        }

        
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
    MatchExternal: {
        firstTeam: async ({ first_team }) => {
            try {
                return await ParticipatingTeams.findByPk(first_team);
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
        secondTeam: async ({ second_team }) => {
            try {
                return await ParticipatingTeams.findByPk(second_team);
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
        firstTeamCards: async ({ first_team }) => {
            try {
                return await MatchCard.findAll({
                    where: {
                        id_team: first_team,
                    },
                });
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
        secondTeamCards: async ({ second_team }) => {
            try {
                return await MatchCard.findAll({
                    where: {
                        id_team: second_team,
                    },
                });
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
        firstTeamScorersMatch: async ({ id, first_team }) => {
            try {
                return await ScorerMatch.findAll({
                    where: {
                        id_match: id,
                        id_participating_team: first_team,
                    },
                });
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
        secondTeamScorersMatch: async ({ id, second_team }) => {
            try {
                return await ScorerMatch.findAll({
                    where: {
                        id_match: id,
                        id_participating_team: second_team,
                    },
                });
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
        arbitre: async ({ id }) => {
            try {
                return await Arbitres.findOne({
                    where: {
                        id_match: id,
                    },
                });
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
        league: async ({ id_league }) => {
            try {
                return await League.findByPk(id_league);
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
    },
    MatchGroupByType: {
        type: (parent) => parent.type,
        matches: (parent) => parent.matches
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
        updateMatch: async (obj, { id, content }, context, info) => {
            console.log('content:', content);

            try {
                // Extract penalty from content to avoid it being included in Match.update
                const { penalty, ...matchFields } = content;

                // 1. Update the match
                const result = await Match.update(matchFields, { where: { id } });

                // 2. Handle penalty logic
                const existingPenalty = await Penalty.findOne({ where: { id_match: id } });

                if (penalty) {
                const { firstTeamPenalty, secondTeamPenalty } = penalty;

                const hasValidPenalty =
                    typeof firstTeamPenalty === 'number' &&
                    typeof secondTeamPenalty === 'number';

                if (hasValidPenalty) {
                    if (existingPenalty) {
                    await existingPenalty.update({ firstTeamPenalty, secondTeamPenalty });
                    } else {
                    await Penalty.create({ id_match: id, firstTeamPenalty, secondTeamPenalty });
                    }
                }
                } else if (existingPenalty) {
                // If no penalty is passed but one exists, delete it
                await existingPenalty.destroy();
                }

                return {
                status: result[0] === 1
                };
            } catch (error) {
                logger.error("Error updating match:", error);
                throw new ApolloError(error.message || "Error while updating match");
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

        createMatchCard: async (obj, { content }, context, info) => {
            try {
                const { date, type, player, id_team, id_match } = content;
        
                // 1. Find ParticipatingPlayers with this number & team
                const participatingPlayer = await ParticipatingPlayers.findOne({
                    where: {
                        number: player,
                        id_participating_team: id_team,
                    },
                    include: [
                        {
                            model: Players,
                            as: "player",
                            include: ["person"],
                        },
                    ],
                });
        
                if (!participatingPlayer) {
                    throw new ApolloError("NO_PLAYER_WITH_THIS_NUMBER");
                }
        
                // 2. Extract player full name from Person
                const fullName = [
                    participatingPlayer.player?.person?.first_name,
                    participatingPlayer.player?.person?.second_name,
                    participatingPlayer.player?.person?.third_name,
                ]
                    .filter(Boolean)
                    .join(" ");
        
                // 3. Create MatchCard
                const matchCard = await MatchCard.create({
                    date,
                    type,
                    player: fullName,
                    id_team,
                    id_match,
                    id_player: participatingPlayer.id_player,
                });
        
                return matchCard;
            } catch (error) {
                console.error("createMatchCard error:", error);
                throw new ApolloError(error.message || "UNEXPECTED_ERROR");
            }
        }
        ,
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
       

        
        createParticipatingPlayersMatch: async (obj, { content }, context, info) => {

          
            try {
              // Step 1: Get all existing player-match entries
              const existingRecords = await ParticipatingPlayersMatch.findAll({
                where: {
                  [Op.or]: content.map(item => ({
                    id_match: item.id_match,
                    id_participating_player: item.id_participating_player,
                  })),
                },
              });
          
              // Step 2: Build set of existing keys
              const existingSet = new Set(
                existingRecords.map(
                  rec => `${rec.id_match}-${rec.id_participating_player}`
                )
              );
          
              // Step 3: Filter out duplicates
              const finalToCreate = content.filter(
                item =>
                  !existingSet.has(`${item.id_match}-${item.id_participating_player}`)
              );
          
              // Step 4: Bulk insert
              return await ParticipatingPlayersMatch.bulkCreate(finalToCreate);
          
            } catch (error) {
              console.log(error);
              throw new ApolloError(error);
            }
          },
             

        updateParticipatingPlayersMatch : async (obj, { content }, context, info) => {
           
            try {
                let result = 0;
        
                for (let i = 0; i < content.length; i++) {
                    const row = content[i];
        
                    if (row.id && row.id !== "") {
                        const id = row.id;
                        delete row.id;
        
                        let resultRow = await ParticipatingPlayersMatch.update({ ...row }, { where: { id } });
                        result = resultRow[0] === 1 ? result + 1 : result;
                    } else {
                        await ParticipatingPlayersMatch.create(row);
                        result++;
                    }
                }
        
                return {
                    status: result >= 1
                };
            } catch (error) {
                console.error("Error updating ParticipatingPlayersMatch:", error);
                throw new ApolloError("Failed to update ParticipatingPlayersMatch");
            }
        },
        
        updateParticipatingPlayerMatchSub: async (_, { id, sub }) => {
    
              try {
                const match = await ParticipatingPlayersMatch.findByPk(id);
                if (!match) {
                  return { status: false };
                }
                match.starter = !match.starter 
                match.sub = sub;
                await match.save();
                
                return { status: true };
              } catch (error) {
                return { status: false };
              }
            },
          
        deleteParticipatingPlayersMatch: async (obj, {id}, context, info) =>  {
       
            try {
                const result = await ParticipatingPlayersMatch.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        /*---------edit-------*/

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

          

                return {
                    status: result[0] >= 1
                }

            } catch (error) {
                throw new ApolloError(error)
            }
        },

        createArbitre: async (_, { id_match, Arbitre1, Arbitre2, Arbitre3, Arbitre4 }) => {
            try {
              const newArbitre = await Arbitres.create({
                id_match,
                Arbitre1,
                Arbitre2,
                Arbitre3,
                Arbitre4,
              });
              return newArbitre;
            } catch (error) {
              throw new ApolloError('Failed to create arbitre', error);
            }
        },

        
        accepteParticipatingTeams: async (obj, { id }, context, info) => {
            try {
                const result = await ParticipatingTeams.update(
                    { status: 'accepted' },
                    { where: { id } }
                );
        
                return {
                    status: result[0] >= 1
                };
            } catch (error) {
                logger.error("Error accepting participating team:", error);
                throw new ApolloError(error.message);
            }
        },
        rejecteParticipatingTeams: async (obj, { id }, context, info) => {
            try {
                const result = await ParticipatingTeams.update(
                    { status: 'rejected' },
                    { where: { id } }
                );
        
                return {
                    status: result[0] >= 1
                };
            } catch (error) {
                logger.error("Error rejecting participating team:", error);
                throw new ApolloError(error.message);
            }
        },

        
        generatMatches: async (_, { leagueId, type }, context) => {

            try {
              // Validate type input
              if (type !== 0 && type !== 1) {
                console.log("Invalid type value.");
                throw new Error("Invalid type value. Use 0 for 'home' or 1 for 'home and away'.");
              }
          
              // Fetch the league details, including startDate and expiryDate
              const league = await League.findByPk(leagueId);
              if (!league) {
                throw new Error("League not found.");
              }
          
              const { startDate, expiryDate } = league;
          
              // Validate league dates
              if (!startDate || !expiryDate) {
                throw new Error("League start and expiry dates must be defined.");
              }
          
              // Parse startDate and expiryDate
              const start = new Date(startDate);
              const end = new Date(expiryDate);
              if (isNaN(start) || isNaN(end) || start > end) {
                throw new Error("Invalid league date range.");
              }
          
              // Helper function to generate a random date-time string in the format `YYYY-MM-DD HH:mm:ss`
              const getRandomDateTime = () => {
                const randomTimestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
                const randomDate = new Date(randomTimestamp);
          
                const hour = Math.floor(Math.random() * (20 - 13 + 1)) + 13; // Random hour between 13 and 20
                const minute = Math.floor(Math.random() * 60); // Random minute
          
                // Combine date and time into `YYYY-MM-DD HH:mm:ss` format
                return `${randomDate.toISOString().split("T")[0]} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
              };
          
              // Fetch all participating teams in the league grouped by their group
              const participatingTeams = await ParticipatingTeams.findAll({
                where: { id_league: leagueId },
                attributes: ["id", "group"],
                include: [
                  {
                    model: Team,
                    as: "team",
                    attributes: ["id", "name"],
                  },
                ],
              });
          
              // Group teams by their groups
              const teamsByGroup = participatingTeams.reduce((groups, team) => {
                if (!groups[team.group]) {
                  groups[team.group] = [];
                }
                groups[team.group].push(team);
                return groups;
              }, {});
          
              // Initialize matches to create
              const matches = [];
          
              // Generate matches for each group
              for (const group in teamsByGroup) {
                const teams = teamsByGroup[group];
          
                // Generate matches based on type
                for (let i = 0; i < teams.length; i++) {
                  for (let j = i + 1; j < teams.length; j++) {
                    const team1 = teams[i];
                    const team2 = teams[j];
          
                    // Add match (team1 vs team2)
                    matches.push({
                      id_league: leagueId,
                      type: "groups",
                      first_team: team1.id,
                      second_team: team2.id,
                      date: getRandomDateTime(), // Random date-time
                    });
          
                    // Add reverse match (team2 vs team1) if type is 1
                    if (type === 1) {
                      matches.push({
                        id_league: leagueId,
                        type: "groups",
                        first_team: team2.id,
                        second_team: team1.id,
                        date: getRandomDateTime(), // Random date-time
                      });
                    }
                  }
                }
              }
          
              // Insert matches into the database
              const createdMatches = await Match.bulkCreate(matches);
          
              return {
                status: true,
                message: createdMatches.length,
              };
            } catch (error) {
              console.error("Error creating matches:", error);
              throw new ApolloError("Failed to create matches. Please try again later.");
            }
          },
        
        freePlayer: async (obj, { id }, context, info) => {
            try {
              const result = await Players.update(
                { id_team: null },
                { where: { id } }
              );
          
              return {
                status: result[0] === 1
              };
            } catch (error) {
              throw new ApolloError("Failed to free the player", "FREE_PLAYER_ERROR", { originalError: error });
            }
          },
        updateMatchState: async (_, { id, state }) => {
            try {
                const match = await Match.findByPk(id);
                if (!match) {
                throw new ApolloError("Match not found");
                }

                const allowedStates = ['before-start', 'playing', 'end'];
                if (!allowedStates.includes(state)) {
                throw new ApolloError("Invalid state value. Allowed: before-start, playing, end");
                }

                match.matchState = state;
                await match.save();

                return { status: true };
            } catch (error) {
                console.error("Error updating match state:", error);
                throw new ApolloError(error.message || "Failed to update match state");
            }
            },
        


    }
}
