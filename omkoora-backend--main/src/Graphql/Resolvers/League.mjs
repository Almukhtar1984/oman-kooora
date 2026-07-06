import { ApolloError } from 'apollo-server-express';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";
import { Op } from 'sequelize';
import {
    Team, League, Match, ParticipatingTeams, MatchCard, ParticipatingPlayers,ParticipatingPlayersMatch,
    Players, ParticipatingTechnicalStaff, TechnicalApparatus, ScorerMatch, Club, Arbitres,Person,Penalty,
    User
} from '../../Models/index.mjs';
import { hashPassword, alreadyExistUser } from '../../Helpers/index.mjs';
import { computeYellowCardAlerts } from '../../Helpers/YellowCards.mjs';
import { buildLineup } from '../../Helpers/MatchLineup.mjs';
import { randomBytes } from 'crypto';


dotenv.config();

// Role "4" = league admin (مسؤول دورة). Has add/edit access scoped to
// their own league but is not allowed to delete anything.
const LEAGUE_ADMIN_ROLE = "4";
const assertNotLeagueAdmin = (context) => {
    const role = context?.user?.role;
    if (role === LEAGUE_ADMIN_ROLE) {
        throw new ApolloError("League admin is not allowed to perform this operation", "FORBIDDEN_ROLE");
    }
};

// Role "5" = match official (مسؤول مباراة). Signs in with a per-match code and
// can only see/update their one assigned match — never delete or manage the
// league, teams, or other matches.
const MATCH_OFFICIAL_ROLE = "5";
const assertNotMatchOfficial = (context) => {
    const role = context?.user?.role;
    if (role === MATCH_OFFICIAL_ROLE) {
        throw new ApolloError("Match official is not allowed to perform this operation", "FORBIDDEN_ROLE");
    }
};

// No ambiguous characters (0/O, 1/I/L) so the code is easy to read and type.
const MATCH_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generateMatchCode = (length = 8) => {
    const bytes = randomBytes(length);
    let out = "";
    for (let i = 0; i < length; i++) {
        out += MATCH_CODE_ALPHABET[bytes[i] % MATCH_CODE_ALPHABET.length];
    }
    return out;
};

// Provision the match-official login for a freshly created match: a role-5
// user whose credentials ARE the code (a synthetic unique email plus the code
// as the password), so the official signs in with just the code. Best-effort:
// the caller wraps this so a failure here never aborts match creation.
const createMatchOfficial = async (match) => {
    let code = generateMatchCode();
    for (let attempt = 0; attempt < 5; attempt++) {
        const clash = await Match.findOne({ where: { code } });
        if (!clash) break;
        code = generateMatchCode();
    }
    const email = `match-${code.toLowerCase()}@match.omkoora`;
    const hashed = await hashPassword(code);
    const user = await User.create({
        email,
        password: hashed,
        role: MATCH_OFFICIAL_ROLE,
        activation: true,
        email_verify: true,
    });
    match.id_user = user.id;
    match.code = code;
    await match.save();
    return { code, user };
};

// A league becomes read-only once its expiryDate day has passed: every
// mutation that touches league data (matches, teams, players, staff,
// cards, scorers, referees...) is rejected so a finished tournament
// can't be altered. Mirrors isLeagueEnded() in the dashboard client.
const LEAGUE_ENDED_MESSAGE = "البطولة منتهية — لا يمكن تعديل أي بيانات تابعة لها";

const isLeagueEnded = (league) => {
    const raw = league?.expiryDate;
    if (!raw || raw === "") return false;
    const expiry = new Date(raw);
    if (isNaN(expiry.getTime())) return false;
    expiry.setHours(23, 59, 59, 999);
    return new Date() > expiry;
};

const toIdList = (value) =>
    [...new Set((Array.isArray(value) ? value : [value]).filter((v) => v && v !== ""))];

const assertLeaguesNotEnded = async (leagueIds) => {
    const ids = toIdList(leagueIds);
    if (ids.length === 0) return;
    const leagues = await League.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'expiryDate'] });
    if (leagues.some(isLeagueEnded)) {
        throw new ApolloError(LEAGUE_ENDED_MESSAGE, "LEAGUE_ENDED");
    }
};

const assertMatchesLeagueNotEnded = async (matchIds) => {
    const ids = toIdList(matchIds);
    if (ids.length === 0) return;
    const rows = await Match.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'id_league'] });
    await assertLeaguesNotEnded(rows.map((r) => r.id_league));
};

const assertMatchCardsLeagueNotEnded = async (cardIds) => {
    const ids = toIdList(cardIds);
    if (ids.length === 0) return;
    const rows = await MatchCard.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'id_match'] });
    await assertMatchesLeagueNotEnded(rows.map((r) => r.id_match));
};

const assertParticipatingTeamsLeagueNotEnded = async (participatingTeamIds) => {
    const ids = toIdList(participatingTeamIds);
    if (ids.length === 0) return;
    const rows = await ParticipatingTeams.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'id_league'] });
    await assertLeaguesNotEnded(rows.map((r) => r.id_league));
};

const assertParticipatingPlayersLeagueNotEnded = async (participatingPlayerIds) => {
    const ids = toIdList(participatingPlayerIds);
    if (ids.length === 0) return;
    const rows = await ParticipatingPlayers.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'id_participating_team'] });
    await assertParticipatingTeamsLeagueNotEnded(rows.map((r) => r.id_participating_team));
};

const assertPlayersMatchLeagueNotEnded = async (playersMatchIds) => {
    const ids = toIdList(playersMatchIds);
    if (ids.length === 0) return;
    const rows = await ParticipatingPlayersMatch.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'id_match'] });
    await assertMatchesLeagueNotEnded(rows.map((r) => r.id_match));
};

const assertTechnicalStaffLeagueNotEnded = async (staffIds) => {
    const ids = toIdList(staffIds);
    if (ids.length === 0) return;
    const rows = await ParticipatingTechnicalStaff.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'id_participating_team'] });
    await assertParticipatingTeamsLeagueNotEnded(rows.map((r) => r.id_participating_team));
};

const assertScorersLeagueNotEnded = async (scorerIds) => {
    const ids = toIdList(scorerIds);
    if (ids.length === 0) return;
    const rows = await ScorerMatch.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'id_match'] });
    await assertMatchesLeagueNotEnded(rows.map((r) => r.id_match));
};

const upsertLeagueAdmin = async (idLeague, email, password) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) throw new ApolloError("Email is required", "EMAIL_REQUIRED");

    const league = await League.findByPk(idLeague);
    if (!league) throw new ApolloError("League not found", "LEAGUE_NOT_FOUND");

    let user = null;
    if (league.id_user) {
        user = await User.findByPk(league.id_user);
    }

    if (user) {
        if (user.email !== normalizedEmail) {
            const taken = await User.findOne({ where: { email: normalizedEmail } });
            if (taken && taken.id !== user.id) {
                throw new ApolloError("Email already used by another account", "EMAIL_TAKEN");
            }
            user.email = normalizedEmail;
        }
        if (password && password !== "") {
            user.password = await hashPassword(password);
        }
        user.role = LEAGUE_ADMIN_ROLE;
        user.activation = true;
        user.email_verify = true;
        await user.save();
    } else {
        const exists = await alreadyExistUser(normalizedEmail);
        if (exists !== false) {
            throw new ApolloError(exists.message || "Email already used", exists.code || "EMAIL_TAKEN");
        }
        if (!password || password === "") {
            throw new ApolloError("Password is required for a new account", "PASSWORD_REQUIRED");
        }
        const hashed = await hashPassword(password);
        user = await User.create({
            email: normalizedEmail,
            password: hashed,
            role: LEAGUE_ADMIN_ROLE,
            activation: true,
            email_verify: true,
        });
        league.id_user = user.id;
        await league.save();
    }

    return { league, user };
};

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
                // League admins (role "4") only see their own league regardless of idClub.
                if (context?.user?.role === LEAGUE_ADMIN_ROLE) {
                    return await League.findAll({
                        where: { id_user: context.user.id }
                    })
                }
                // Match officials (role "5") only see the league that holds their match.
                if (context?.user?.role === MATCH_OFFICIAL_ROLE) {
                    const myMatch = await Match.findOne({
                        where: { id_user: context.user.id },
                        attributes: ['id_league']
                    })
                    if (!myMatch) return []
                    return await League.findAll({ where: { id: myMatch.id_league } })
                }
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

        participatingPlayersByLeague: async (obj, {idLeague}, context, info) =>  {
            try {
                return await ParticipatingPlayers.findAll({
                    include: [
                        {
                            model: ParticipatingTeams,
                            as: 'participating_team',
                            required: true,
                            where: { id_league: idLeague },
                            include: [
                                { model: Team, as: 'team', include: [{ model: Club, as: 'club' }] }
                            ]
                        },
                        {
                            model: Players,
                            as: 'player',
                            include: [{ model: Person, as: 'person' }]
                        }
                    ]
                })
            } catch (error) {
                logger.error("participatingPlayersByLeague error", error)
                throw new ApolloError(error)
            }
        },

        participatingTeamsByLeague: async (obj, {idLeague}, context, info) =>  {
            try {
                return await ParticipatingTeams.findAll({
                    where: { id_league: idLeague },
                    include: [
                        { model: Team, as: 'team', include: [{ model: Club, as: 'club' }] },
                        { model: League, as: 'league', attributes: ['id', 'name'] }
                    ]
                })
            } catch (error) {
                logger.error("participatingTeamsByLeague error", error)
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

        // Public, print-ready lineup for one match: both teams' players with
        // their أساسي/احتياط status. Assembled server-side so the token-less
        // print app can render it as a formal match sheet.
        matchLineup: async (_, { id }) => {
            try {
                const match = await Match.findByPk(id);
                if (!match) return null;

                const league = match.id_league ? await League.findByPk(match.id_league) : null;

                const teamName = async (ptId) => {
                    if (!ptId) return "";
                    const pt = await ParticipatingTeams.findByPk(ptId);
                    const team = pt ? await Team.findByPk(pt.id_team) : null;
                    return team?.name || "";
                };

                const lineupFor = async (ptId) => {
                    if (!ptId) return [];
                    const rows = await ParticipatingPlayersMatch.findAll({
                        where: { id_match: id },
                        include: [{
                            model: ParticipatingPlayers,
                            as: "participating_player",
                            where: { id_participating_team: ptId },
                            attributes: ["id", "number", "id_player"],
                        }],
                    });
                    // Bulk-load player names (avoid a query per row).
                    const playerIds = [...new Set(rows.map(r => r.participating_player?.id_player).filter(Boolean))];
                    const players = playerIds.length ? await Players.findAll({
                        where: { id: playerIds },
                        attributes: ["id", "player_center"],
                        include: [{ model: Person, as: "person", attributes: ["first_name", "second_name", "third_name", "tribe"] }],
                    }) : [];
                    const playerById = new Map(players.map(p => [p.id, p]));

                    return buildLineup(rows.map(r => {
                        const pp = r.participating_player;
                        const pl = pp ? playerById.get(pp.id_player) : null;
                        return {
                            starter: r.starter,
                            sub: r.sub,
                            number: pp?.number,
                            player_center: pl?.player_center,
                            person: pl?.person,
                        };
                    }));
                };

                return {
                    id: match.id,
                    date: match.date,
                    leagueName: league?.name || "",
                    firstTeamName: await teamName(match.first_team),
                    secondTeamName: await teamName(match.second_team),
                    firstTeamPlayers: await lineupFor(match.first_team),
                    secondTeamPlayers: await lineupFor(match.second_team),
                };
            } catch (error) {
                logger.error("matchLineup error:", error.message);
                throw new ApolloError("Failed to build match lineup.");
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

        // Flags every player booked (yellow) in two CONSECUTIVE fixtures of
        // their own team, for the organiser. Returns the player, the two
        // back-to-back matches, and their total yellow count.
        yellowCardAlerts: async (_, { leagueId }) => {
            try {
                const matches = await Match.findAll({
                    where: { id_league: leagueId },
                    attributes: ['id', 'date', 'first_team', 'second_team', 'createdAt']
                });
                if (!matches.length) return [];
                const matchById = new Map(matches.map(m => [m.id, m]));

                const cards = await MatchCard.findAll({
                    where: { id_match: matches.map(m => m.id), type: 'yellow' }
                });
                if (!cards.length) return [];

                // Pure core: which players were booked in two consecutive fixtures.
                const raw = computeYellowCardAlerts(
                    matches.map(m => ({
                        id: m.id, date: m.date, first_team: m.first_team,
                        second_team: m.second_team, createdAt: new Date(m.createdAt).getTime()
                    })),
                    cards.map(c => ({ id_match: c.id_match, id_player: c.id_player, player: c.player, id_team: c.id_team }))
                );
                if (!raw.length) return [];

                // Hydrate names in bulk — one query each, no per-alert lookups.
                const ptIds = [...new Set(matches.flatMap(m => [m.first_team, m.second_team]).filter(Boolean))];
                const pts = await ParticipatingTeams.findAll({
                    where: { id: ptIds },
                    include: [{ model: Team, as: 'team', attributes: ['id', 'name'] }]
                });
                const teamNameByPt = new Map(pts.map(pt => [pt.id, pt.team?.name || '']));
                const teamByPt = new Map(pts.map(pt => [pt.id, pt.team || null]));

                const pps = await ParticipatingPlayers.findAll({
                    where: {
                        id_player: [...new Set(raw.map(r => r.key))],
                        id_participating_team: [...new Set(raw.map(r => r.ptId))]
                    },
                    attributes: ['number', 'id_player', 'id_participating_team']
                });
                const numberByPlayerPt = new Map(
                    pps.map(pp => [`${pp.id_player}|${pp.id_participating_team}`, pp.number])
                );

                const brief = (mid) => {
                    const m = matchById.get(mid);
                    return m ? {
                        id: m.id,
                        date: m.date,
                        firstTeam: teamNameByPt.get(m.first_team) || '',
                        secondTeam: teamNameByPt.get(m.second_team) || ''
                    } : null;
                };

                return raw.map(r => ({
                    player: r.player,
                    number: numberByPlayerPt.get(`${r.key}|${r.ptId}`) || '',
                    team: teamByPt.get(r.ptId) || null,
                    yellowCount: r.yellowCount,
                    matches: r.matchIds.map(brief).filter(Boolean)
                }));
            } catch (error) {
                console.error("yellowCardAlerts error:", error);
                throw new ApolloError("Failed to compute yellow-card alerts.");
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
                const where = { id_league: id }
                // A match official sees only their own match within the league.
                if (context?.user?.role === MATCH_OFFICIAL_ROLE) {
                    where.id_user = context.user.id
                }
                return await Match.findAll({
                    where,
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
        user: async ({id_user}, {}, context, info) =>  {
            if (!id_user) return null;
            try {
                return await User.findByPk(id_user)
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
                const { adminEmail, adminPassword, ...rest } = content || {}
                const league = await League.create({ ...rest })

                if (adminEmail && adminEmail !== "") {
                    await upsertLeagueAdmin(league.id, adminEmail, adminPassword)
                }

                return await League.findByPk(league.id)
            } catch (error) {
                console.log(error)
                throw new ApolloError(error)
            }
        },
        updateLeague: async (obj, {id, content}, context, info) =>  {
            try {
                // League admins can't touch an ended league at all; the super
                // admin keeps access to the league record itself as an escape
                // hatch (e.g. to fix a wrong expiryDate).
                if (context?.user?.role === LEAGUE_ADMIN_ROLE) {
                    await assertLeaguesNotEnded(id)
                }
                const { adminEmail, adminPassword, ...rest } = content || {}
                let result = await League.update({ ...rest }, { where: { id } })

                if (adminEmail && adminEmail !== "") {
                    await upsertLeagueAdmin(id, adminEmail, adminPassword)
                }

                return {
                    status: result[0] === 1 || (adminEmail && adminEmail !== "")
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },
        setLeagueAdmin: async (obj, {idLeague, email, password}, context, info) => {
            try {
                assertNotLeagueAdmin(context) // league admin can't reassign their own login
                assertNotMatchOfficial(context)
                const { league } = await upsertLeagueAdmin(idLeague, email, password)
                return await League.findByPk(league.id)
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("setLeagueAdmin error")
                throw new ApolloError(error)
            }
        },
        clearLeagueAdmin: async (obj, {idLeague}, context, info) => {
            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                const league = await League.findByPk(idLeague)
                if (!league) throw new ApolloError("League not found", "LEAGUE_NOT_FOUND")
                const previousUserId = league.id_user
                league.id_user = null
                await league.save()
                if (previousUserId) {
                    // Remove the orphan login so the email can be reused.
                    await User.destroy({ where: { id: previousUserId } })
                }
                return { status: true }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("clearLeagueAdmin error")
                throw new ApolloError(error)
            }
        },
        deleteLeague: async (obj, {id}, context, info) =>  {
            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                const league = await League.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },


        createParticipatingTeams: async (obj, {content}, context, info) =>  {
            try {
                const rows = (content || []).filter((row) => row && row.id_team && row.id_team !== "" && row.id_league)
                if (rows.length === 0) return []
                await assertLeaguesNotEnded(rows.map((r) => r.id_league))

                // Never invite the same team into the same league twice. Guards
                // against duplicate/over-invitation when the modal is submitted
                // more than once or the same team is picked in two rows.
                const leagueIds = [...new Set(rows.map((r) => r.id_league))]
                const existing = await ParticipatingTeams.findAll({
                    where: { id_league: { [Op.in]: leagueIds } },
                    attributes: ['id_league', 'id_team'],
                    raw: true
                })
                const seen = new Set(existing.map((e) => `${e.id_league}::${e.id_team}`))
                const freshRows = rows.filter((r) => {
                    const key = `${r.id_league}::${r.id_team}`
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                if (freshRows.length === 0) return []
                const created = await ParticipatingTeams.bulkCreate(freshRows)

                // Auto-import the team's accepted technical staff so the
                // league dashboard's "عرض جهاز فني" modal isn't empty
                // for newly enrolled teams. Wrapped in its own try/catch:
                // a failure here must not roll back the team enrolment.
                try {
                    const teamIds = [...new Set(created.map((pt) => pt.id_team).filter(Boolean))]
                    if (teamIds.length > 0) {
                        const staff = await TechnicalApparatus.findAll({
                            where: { id_team: { [Op.in]: teamIds }, status: 'accepted' },
                            attributes: ['id', 'id_team']
                        })
                        const staffByTeam = new Map()
                        for (const s of staff) {
                            const list = staffByTeam.get(s.id_team) || []
                            list.push(s.id)
                            staffByTeam.set(s.id_team, list)
                        }
                        const staffRows = []
                        for (const pt of created) {
                            for (const idTech of (staffByTeam.get(pt.id_team) || [])) {
                                staffRows.push({
                                    id_participating_team: pt.id,
                                    id_technical_apparatus: idTech
                                })
                            }
                        }
                        if (staffRows.length > 0) {
                            await ParticipatingTechnicalStaff.bulkCreate(staffRows)
                        }
                    }
                } catch (e) {
                    logger.error("createParticipatingTeams: auto-import technical staff failed", e)
                }

                return created
            } catch (error) {
                if (error instanceof ApolloError) throw error
                console.log(error)
                throw new ApolloError(error)
            }
        },
        updateParticipatingTeams: async (obj, {id, content}, context, info) =>  {
            try {
                await assertParticipatingTeamsLeagueNotEnded((content || []).map((r) => r?.id))
                await assertLeaguesNotEnded((content || []).map((r) => r?.id_league))

                let touched = 0

                for (let i = 0; i < (content || []).length; i++) {
                    const row = content[i]
                    // Skip placeholder rows that the modal pre-fills before the
                    // user has chosen a team — without this guard a single
                    // empty row throws and aborts the whole loop.
                    const isPlaceholder = !row.id_team || row.id_team === ""
                    if (isPlaceholder && (!row.id || row.id === "")) continue

                    if (row.id && row.id !== "") {
                        const id = row.id
                        delete row.id

                        const resultRow = await ParticipatingTeams.update({...row}, { where: { id } })
                        if (resultRow[0] >= 1) touched += 1
                    } else {
                        await ParticipatingTeams.create(row)
                        touched += 1
                    }
                }

                return {
                    status: touched >= 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("updateParticipatingTeams failed", error)
                throw new ApolloError(error)
            }
        },
        deleteParticipatingTeams: async (obj, {id}, context, info) =>  {
            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                await assertParticipatingTeamsLeagueNotEnded(id)
                const league = await ParticipatingTeams.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createMatch: async (obj, {content}, context, info) =>  {
            try {
                assertNotMatchOfficial(context)
                await assertLeaguesNotEnded(content?.id_league)
                const match = await Match.create({...content})
                // Provision the official's login code. Best-effort: a failure
                // here must not roll back the created match.
                try {
                    await createMatchOfficial(match)
                } catch (e) {
                    logger.error("createMatch: match-official account failed", e)
                }
                return match

            } catch (error) {
                if (error instanceof ApolloError) throw error
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        updateMatch: async (obj, { id, content }, context, info) => {
            console.log('content:', content);

            try {
                await assertMatchesLeagueNotEnded(id)
                // A match official may only update the one match assigned to them.
                if (context?.user?.role === MATCH_OFFICIAL_ROLE) {
                    const own = await Match.findOne({ where: { id, id_user: context.user.id }, attributes: ['id'] })
                    if (!own) throw new ApolloError("Not allowed to update this match", "FORBIDDEN_MATCH")
                }
                // Extract penalty from content to avoid it being included in Match.update
                const { penalty, ...matchFields } = content;

                // 1. Update the match
                const result = await Match.update(matchFields, { where: { id } });

                // 2. Handle penalty logic — an omitted (undefined) penalty
                // means "don't touch the stored shootout" so partial updates
                // (man of the match, date, teams...) can't wipe it. Passing
                // an explicit null clears it (e.g. result is no longer a draw).
                if (penalty !== undefined) {
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
                        await existingPenalty.destroy();
                    }
                }

                return {
                status: result[0] === 1
                };
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("Error updating match:", error);
                throw new ApolloError(error.message || "Error while updating match");
            }
            },

        deleteMatch: async (obj, {id}, context, info) =>  {
            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                await assertMatchesLeagueNotEnded(id)
                const league = await Match.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createMatchCard: async (obj, { content }, context, info) => {
            try {
                const { date, type, player, id_team, id_match } = content;

                await assertMatchesLeagueNotEnded(id_match);

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
                if (error instanceof ApolloError) throw error
                console.error("createMatchCard error:", error);
                throw new ApolloError(error.message || "UNEXPECTED_ERROR");
            }
        }
        ,
        updateMatchCard: async (obj, {id, content}, context, info) =>  {
            try {
                await assertMatchCardsLeagueNotEnded(id)
                let result = await MatchCard.update({...content}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteMatchCard: async (obj, {id}, context, info) =>  {

            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                await assertMatchCardsLeagueNotEnded(id)
                const league = await MatchCard.destroy({ where: { id } })

                return {
                    status: league === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },

        createParticipatingPlayers: async (obj, {content}, context, info) =>  {
            try {
                await assertParticipatingTeamsLeagueNotEnded((content || []).map((r) => r?.id_participating_team))
                return await ParticipatingPlayers.bulkCreate(content)

            } catch (error) {
                if (error instanceof ApolloError) throw error
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateParticipatingPlayers: async (obj, {content}, context, info) =>  {
            try {
                await assertParticipatingPlayersLeagueNotEnded((content || []).map((r) => r?.id))
                await assertParticipatingTeamsLeagueNotEnded((content || []).map((r) => r?.id_participating_team))

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
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },
        deleteParticipatingPlayers: async (obj, {id}, context, info) =>  {
            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                await assertParticipatingPlayersLeagueNotEnded(id)
                const result = await ParticipatingPlayers.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },
       

        
        createParticipatingPlayersMatch: async (obj, { content }, context, info) => {

          
            try {
              await assertMatchesLeagueNotEnded(content.map((item) => item?.id_match));

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
              if (error instanceof ApolloError) throw error
              console.log(error);
              throw new ApolloError(error);
            }
          },


        updateParticipatingPlayersMatch : async (obj, { content }, context, info) => {

            try {
                await assertPlayersMatchLeagueNotEnded((content || []).map((r) => r?.id));
                await assertMatchesLeagueNotEnded((content || []).map((r) => r?.id_match));

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
                if (error instanceof ApolloError) throw error
                console.error("Error updating ParticipatingPlayersMatch:", error);
                throw new ApolloError("Failed to update ParticipatingPlayersMatch");
            }
        },

        updateParticipatingPlayerMatchSub: async (_, { id, sub }) => {

              try {
                await assertPlayersMatchLeagueNotEnded(id);
                const match = await ParticipatingPlayersMatch.findByPk(id);
                if (!match) {
                  return { status: false };
                }
                match.starter = !match.starter
                match.sub = sub;
                await match.save();

                return { status: true };
              } catch (error) {
                if (error instanceof ApolloError) throw error
                return { status: false };
              }
            },

        deleteParticipatingPlayersMatch: async (obj, {id}, context, info) =>  {

            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                await assertPlayersMatchLeagueNotEnded(id)
                const result = await ParticipatingPlayersMatch.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },

        /*---------edit-------*/

        createParticipatingTechnicalStaff: async (obj, {content}, context, info) =>  {
            try {
                const filtered = (content || []).filter(
                    (r) => r?.id_participating_team && r?.id_technical_apparatus
                );
                if (filtered.length === 0) {
                    logger.error("createParticipatingTechnicalStaff: empty content after filtering")
                    throw new ApolloError("لا توجد بيانات صالحة لإضافتها")
                }
                await assertParticipatingTeamsLeagueNotEnded(filtered.map((r) => r.id_participating_team))
                return await ParticipatingTechnicalStaff.bulkCreate(filtered)
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("createParticipatingTechnicalStaff failed", error)
                throw new ApolloError(error?.message || "createParticipatingTechnicalStaff failed")
            }
        },
        updateParticipatingTechnicalStaff: async (obj, {content}, context, info) =>  {
            try {
                await assertTechnicalStaffLeagueNotEnded((content || []).map((r) => r?.id))
                await assertParticipatingTeamsLeagueNotEnded((content || []).map((r) => r?.id_participating_team))

                let touched = 0

                for (let i = 0; i < content.length; i++) {
                    const row = content[i]

                    if (row.id && row.id !== "") {
                        const id = row.id
                        delete row.id

                        const resultRow = await ParticipatingTechnicalStaff.update({...row}, { where: { id } })
                        if (resultRow[0] >= 1) touched += 1
                    } else {
                        await ParticipatingTechnicalStaff.create(row)
                        touched += 1
                    }
                }

                return {
                    status: touched >= 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("updateParticipatingTechnicalStaff failed", error)
                throw new ApolloError(error)
            }
        },
        deleteParticipatingTechnicalStaff: async (obj, {id}, context, info) =>  {
            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                await assertTechnicalStaffLeagueNotEnded(id)
                const result = await ParticipatingTechnicalStaff.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("")
                throw new ApolloError(error)
            }
        },
        
        createScorerMatch: async (obj, {content}, context, info) =>  {
            try {
                await assertMatchesLeagueNotEnded(content?.id_match)
                return await ScorerMatch.create(content)

            } catch (error) {
                if (error instanceof ApolloError) throw error
                throw new ApolloError(error)
            }
        },
        updateScorerMatch: async (obj, {content}, context, info) =>  {
            try {
                await assertScorersLeagueNotEnded((content || []).map((r) => r?.id))
                await assertMatchesLeagueNotEnded((content || []).map((r) => r?.id_match))

                let touched = 0

                for (let i = 0; i < content.length; i++) {
                    const row = content[i]

                    if (row.id && row.id !== "") {
                        const id = row.id
                        delete row.id

                        const resultRow = await ScorerMatch.update({...row}, { where: { id } })
                        if (resultRow[0] >= 1) touched += 1
                    } else {
                        await ScorerMatch.create(row)
                        touched += 1
                    }
                }

                return {
                    status: touched >= 1
                }

            } catch (error) {
                if (error instanceof ApolloError) throw error
                throw new ApolloError(error)
            }
        },
        deleteScorerMatch: async (obj, {id}, context, info) =>  {
            try {
                assertNotLeagueAdmin(context)
                assertNotMatchOfficial(context)
                await assertScorersLeagueNotEnded(id)
                const removed = await ScorerMatch.destroy({ where: { id } })
                return { status: removed >= 1 }
            } catch (error) {
                if (error instanceof ApolloError) throw error
                throw new ApolloError(error)
            }
        },

        createArbitre: async (_, { id_match, Arbitre1, Arbitre2, Arbitre3, Arbitre4 }) => {
            try {
              await assertMatchesLeagueNotEnded(id_match);
              const existing = await Arbitres.findOne({ where: { id_match } });
              if (existing) {
                existing.Arbitre1 = Arbitre1;
                existing.Arbitre2 = Arbitre2;
                existing.Arbitre3 = Arbitre3;
                existing.Arbitre4 = Arbitre4;
                await existing.save();
                return existing;
              }
              const newArbitre = await Arbitres.create({
                id_match,
                Arbitre1,
                Arbitre2,
                Arbitre3,
                Arbitre4,
              });
              return newArbitre;
            } catch (error) {
              if (error instanceof ApolloError) throw error
              throw new ApolloError('Failed to create arbitre', error);
            }
        },

        
        accepteParticipatingTeams: async (obj, { id }, context, info) => {
            try {
                await assertParticipatingTeamsLeagueNotEnded(id);
                const result = await ParticipatingTeams.update(
                    { status: 'accepted' },
                    { where: { id } }
                );

                return {
                    status: result[0] >= 1
                };
            } catch (error) {
                if (error instanceof ApolloError) throw error
                logger.error("Error accepting participating team:", error);
                throw new ApolloError(error.message);
            }
        },
        rejecteParticipatingTeams: async (obj, { id }, context, info) => {
            try {
                await assertParticipatingTeamsLeagueNotEnded(id);
                const result = await ParticipatingTeams.update(
                    { status: 'rejected' },
                    { where: { id } }
                );

                return {
                    status: result[0] >= 1
                };
            } catch (error) {
                if (error instanceof ApolloError) throw error
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

              if (isLeagueEnded(league)) {
                throw new ApolloError(LEAGUE_ENDED_MESSAGE, "LEAGUE_ENDED");
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
              if (error instanceof ApolloError) throw error
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

                await assertLeaguesNotEnded(match.id_league);

                const allowedStates = ['before-start', 'playing', 'end'];
                if (!allowedStates.includes(state)) {
                throw new ApolloError("Invalid state value. Allowed: before-start, playing, end");
                }

                match.matchState = state;
                await match.save();

                return { status: true };
            } catch (error) {
                if (error instanceof ApolloError) throw error
                console.error("Error updating match state:", error);
                throw new ApolloError(error.message || "Failed to update match state");
            }
            },
        


    }
}
