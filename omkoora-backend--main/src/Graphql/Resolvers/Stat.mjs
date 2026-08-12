import { ApolloError, AuthenticationError } from 'apollo-server-express';
import dotenv from 'dotenv';
import { Op } from 'sequelize'; // Import Sequelize operators

import logger from "../../Config/logger.mjs";
import {
  Club, Team, League, Players, Match, Stadium, Members, Blog,
  TechnicalApparatus, Assembly, ClubManagement, Transfer, User,
} from '../../Models/index.mjs';

dotenv.config();

export const resolvers = {
  Query: {
    // Aggregate-only statistics for the super-admin dashboard. No personal
    // data is returned — only counts and grouped breakdowns.
    platformStatistics: async (parent, args, context, info) => {
      const { user, isAuth } = context;
      if (!isAuth || !user) {
        return new AuthenticationError("Authentication required");
      }
      if (user.role !== "1") {
        return new ApolloError("Only the super-admin can view platform statistics", "FORBIDDEN_ROLE");
      }

      // Arabic labels for the fixed player age categories (Players.class enum).
      const AGE_LABELS = {
        firstDegree: "الفريق الأول",
        secondDegree: "تحت 23 سنة",
        rookies: "تحت 18 سنة",
        young: "تحت 16 سنة",
      };
      const STATUS_LABELS = {
        accepted: "مقبول",
        waiting: "قيد الانتظار",
        waiting_club: "بانتظار النادي",
        rejected: "مرفوض",
        suspended: "موقوف",
      };
      const ROLE_LABELS = {
        "1": "مدير النظام",
        "2": "مدير نادٍ",
        "3": "مدير فريق",
        "4": "مدير مسابقة",
        "5": "حكم / مسؤول مباراة",
      };

      // Turn an object of {key: count} into a sorted [{name, count}] array.
      const toChart = (obj) =>
        Object.entries(obj)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

      try {
        // Pull the rows we need to aggregate in parallel (columns only, no
        // eager includes / personal fields).
        const [
          clubs, teams, players, members, technicals, assembly, board, users,
          stadiumRows, leagueRows, transferRows,
        ] = await Promise.all([
          Club.findAll({ attributes: ["id", "name", "mohafada"] }),
          Team.findAll({ attributes: ["id", "id_club", "activities"] }),
          Players.findAll({ attributes: ["id_team", "class", "status"] }),
          Members.findAll({ attributes: ["id_team"] }),
          TechnicalApparatus.findAll({ attributes: ["id_team"] }),
          Assembly.findAll({ attributes: ["id_club", "id_team"] }),
          ClubManagement.findAll({ attributes: ["id_club"] }),
          User.findAll({ attributes: ["role"] }),
          Stadium.findAll({ attributes: ["id_team"] }),
          League.findAll({ attributes: ["id_club"] }),
          Transfer.findAll({ attributes: ["transition_type", "id_club_to", "id_team_from"] }),
        ]);
        const loans = transferRows.filter((t) => t.transition_type === "loan").length;
        const transfers = transferRows.filter((t) => t.transition_type === "transition").length;

        // team -> club lookup (children of a team roll up to that team's club).
        const teamToClub = {};
        teams.forEach((t) => { teamToClub[t.id] = t.id_club; });

        // Per-club accumulator (numbers + per-club breakdown maps).
        const perClub = {};
        clubs.forEach((c) => {
          perClub[c.id] = {
            id: c.id, name: c.name, governorate: c.mohafada || "غير محدد",
            teams: 0, players: 0, members: 0, technicals: 0, assembly: 0, board: 0,
            leagues: 0, stadiums: 0, loans: 0, transfers: 0,
            _activities: {}, _ages: {},
          };
        });
        const bump = (clubId, key) => { if (clubId && perClub[clubId]) perClub[clubId][key] += 1; };

        teams.forEach((t) => {
          bump(t.id_club, "teams");
          if (t.id_club && perClub[t.id_club]) {
            const a = (t.activities && String(t.activities).trim()) || "غير محدد";
            perClub[t.id_club]._activities[a] = (perClub[t.id_club]._activities[a] || 0) + 1;
          }
        });
        players.forEach((p) => {
          const clubId = teamToClub[p.id_team];
          bump(clubId, "players");
          if (clubId && perClub[clubId]) {
            const label = AGE_LABELS[p.class] || "أخرى";
            perClub[clubId]._ages[label] = (perClub[clubId]._ages[label] || 0) + 1;
          }
        });
        members.forEach((m) => bump(teamToClub[m.id_team], "members"));
        technicals.forEach((t) => bump(teamToClub[t.id_team], "technicals"));
        assembly.forEach((a) => bump(a.id_club || teamToClub[a.id_team], "assembly"));
        board.forEach((b) => bump(b.id_club, "board"));
        leagueRows.forEach((l) => bump(l.id_club, "leagues"));
        stadiumRows.forEach((st) => bump(teamToClub[st.id_team], "stadiums"));
        transferRows.forEach((tr) => {
          const clubId = tr.id_club_to || teamToClub[tr.id_team_from];
          bump(clubId, tr.transition_type === "loan" ? "loans" : "transfers");
        });

        const clubTotals = Object.values(perClub)
          .map(({ _activities, _ages, ...c }) => ({
            ...c,
            total: c.players + c.members + c.technicals + c.assembly + c.board,
            activities: toChart(_activities),
            ageCategories: Object.keys(AGE_LABELS)
              .map((k) => AGE_LABELS[k])
              .map((label) => ({ name: label, count: _ages[label] || 0 })),
          }))
          .sort((a, b) => b.total - a.total);

        // Breakdowns.
        const activitiesAcc = {};
        teams.forEach((t) => {
          const key = (t.activities && String(t.activities).trim()) || "غير محدد";
          activitiesAcc[key] = (activitiesAcc[key] || 0) + 1;
        });

        const ageAcc = {};
        Object.keys(AGE_LABELS).forEach((k) => { ageAcc[AGE_LABELS[k]] = 0; });
        const statusAcc = {};
        players.forEach((p) => {
          const ageLabel = AGE_LABELS[p.class] || "أخرى";
          ageAcc[ageLabel] = (ageAcc[ageLabel] || 0) + 1;
          const stLabel = STATUS_LABELS[p.status] || p.status || "غير محدد";
          statusAcc[stLabel] = (statusAcc[stLabel] || 0) + 1;
        });

        const govAcc = {};
        clubs.forEach((c) => {
          const key = c.mohafada || "غير محدد";
          govAcc[key] = (govAcc[key] || 0) + 1;
        });

        const roleAcc = {};
        users.forEach((u) => {
          const label = ROLE_LABELS[u.role] || `دور ${u.role}`;
          roleAcc[label] = (roleAcc[label] || 0) + 1;
        });

        const totalPeople =
          players.length + members.length + technicals.length + assembly.length + board.length;

        return {
          clubs: clubs.length,
          teams: teams.length,
          players: players.length,
          members: members.length,
          technicals: technicals.length,
          boardManagement: board.length,
          assembly: assembly.length,
          stadiums: stadiumRows.length,
          leagues: leagueRows.length,
          loans,
          transfers,
          viewers: users.length,
          totalPeople,
          activities: toChart(activitiesAcc),
          // keep age categories in their natural order (not count-sorted)
          ageCategories: Object.keys(AGE_LABELS).map((k) => ({
            name: AGE_LABELS[k], count: ageAcc[AGE_LABELS[k]] || 0,
          })),
          playersByStatus: toChart(statusAcc),
          clubsByGovernorate: toChart(govAcc),
          usersByRole: toChart(roleAcc),
          clubTotals,
        };
      } catch (error) {
        logger.error(`platformStatistics error: ${error.message}`);
        throw new ApolloError("Failed to build platform statistics", "PLATFORM_STATISTICS_FAILED", { error });
      }
    },
    // Aggregate-only statistics scoped to ONE club (club app dashboard).
    // A club admin (role "2") is forced to their own club; a super-admin
    // (role "1") may pass any idClub. No personal data is returned.
    clubStatistics: async (parent, { idClub }, context, info) => {
      const { user, isAuth } = context;
      if (!isAuth || !user) {
        return new AuthenticationError("Authentication required");
      }

      const AGE_LABELS = {
        firstDegree: "الفريق الأول",
        secondDegree: "تحت 23 سنة",
        rookies: "تحت 18 سنة",
        young: "تحت 16 سنة",
      };
      const STATUS_LABELS = {
        accepted: "مقبول",
        waiting: "قيد الانتظار",
        waiting_club: "بانتظار النادي",
        rejected: "مرفوض",
        suspended: "موقوف",
      };
      const toChart = (obj) =>
        Object.entries(obj).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

      try {
        // Decide which club the caller is allowed to view.
        let targetClubId = idClub;
        if (user.role === "2") {
          // Club admin: always scope to their own club, ignore any passed id.
          const cm = await ClubManagement.findOne({ where: { id_person: user.id_person } });
          if (!cm) return new ApolloError("No club is linked to this account", "NO_CLUB");
          targetClubId = cm.id_club;
        } else if (user.role !== "1") {
          return new ApolloError("Not allowed to view club statistics", "FORBIDDEN_ROLE");
        }
        if (!targetClubId) return new ApolloError("idClub is required", "IDCLUB_REQUIRED");

        const club = await Club.findByPk(targetClubId, { attributes: ["id", "name", "mohafada"] });
        if (!club) return new ApolloError("Club not found", "CLUB_NOT_FOUND");

        const teams = await Team.findAll({ where: { id_club: club.id }, attributes: ["id", "activities"] });
        const teamIds = teams.map((t) => t.id);
        const hasTeams = teamIds.length > 0;
        const inTeams = { id_team: { [Op.in]: teamIds } };

        const [players, membersCount, technicalsCount, assemblyRows, boardCount, stadiumsCount, leaguesCount, transferRows] =
          await Promise.all([
            hasTeams ? Players.findAll({ where: inTeams, attributes: ["class", "status"] }) : [],
            hasTeams ? Members.count({ where: inTeams }) : 0,
            hasTeams ? TechnicalApparatus.count({ where: inTeams }) : 0,
            Assembly.findAll({
              where: hasTeams ? { [Op.or]: [{ id_club: club.id }, { id_team: { [Op.in]: teamIds } }] } : { id_club: club.id },
              attributes: ["id"],
            }),
            ClubManagement.count({ where: { id_club: club.id } }),
            hasTeams ? Stadium.count({ where: inTeams }) : 0,
            League.count({ where: { id_club: club.id } }),
            Transfer.findAll({ attributes: ["transition_type", "id_club_to", "id_team_from"] }),
          ]);

        const teamSet = new Set(teamIds);
        const clubTransfers = transferRows.filter((t) => t.id_club_to === club.id || teamSet.has(t.id_team_from));
        const loans = clubTransfers.filter((t) => t.transition_type === "loan").length;
        const transfers = clubTransfers.filter((t) => t.transition_type === "transition").length;

        // Breakdowns.
        const activitiesAcc = {};
        teams.forEach((t) => {
          const key = (t.activities && String(t.activities).trim()) || "غير محدد";
          activitiesAcc[key] = (activitiesAcc[key] || 0) + 1;
        });
        const ageAcc = {};
        const statusAcc = {};
        players.forEach((p) => {
          const ageLabel = AGE_LABELS[p.class] || "أخرى";
          ageAcc[ageLabel] = (ageAcc[ageLabel] || 0) + 1;
          const stLabel = STATUS_LABELS[p.status] || p.status || "غير محدد";
          statusAcc[stLabel] = (statusAcc[stLabel] || 0) + 1;
        });

        const totalPeople = players.length + membersCount + technicalsCount + assemblyRows.length + boardCount;

        return {
          club: club.name,
          governorate: club.mohafada || "غير محدد",
          teams: teams.length,
          players: players.length,
          members: membersCount,
          technicals: technicalsCount,
          boardManagement: boardCount,
          assembly: assemblyRows.length,
          stadiums: stadiumsCount,
          leagues: leaguesCount,
          loans,
          transfers,
          totalPeople,
          activities: toChart(activitiesAcc),
          ageCategories: Object.keys(AGE_LABELS).map((k) => ({ name: AGE_LABELS[k], count: ageAcc[AGE_LABELS[k]] || 0 })),
          playersByStatus: toChart(statusAcc),
        };
      } catch (error) {
        logger.error(`clubStatistics error: ${error.message}`);
        throw new ApolloError("Failed to build club statistics", "CLUB_STATISTICS_FAILED", { error });
      }
    },

    StateFilter: async (parent, args, context, info) => {
      console.log("====");
      try {
        // Fetch all data from Club, Team, and League models
        const clubs = await Club.findAll();
        const teams = await Team.findAll();
        const leagues = await League.findAll();

        return {
          Club: clubs,
          Team: teams,
          League: leagues,
        };
      } catch (error) {
        logger.error('Error fetching StateFilter data: ', error);
        throw new ApolloError("Failed to fetch data for StateFilter", "StateFilter_FETCH_FAILED", { error });
      }
    },
    SearchData: async (parent, args, context, info) => {
      console.log("==== nami");
      let AgeDict = {
        "الفريق الاول": "firstDegree",
        "تحت 23 سنة": "secondDegree",
        "تحت 18 سنة": "rookies",
        "تحت 16 سنة": "young",
      };
      const { filters } = args;
      //console.log("filters:", filters);

      try {
        // Fetch clubs where mohafada matches the received filter
        const clubs = await Club.findAll({
          where: {
            mohafada: {
              [Op.in]: filters.mohfada,
            },
          },
        });

        // Count the number of clubs per mohafada
        const mohafadaClubCount = clubs.reduce((acc, club) => {
          acc[club.mohafada] = (acc[club.mohafada] || 0) + 1;
          return acc;
        }, {});

        // Transform mohafadaClubCount to an array of objects for GraphQL compatibility
        const mohafadaClubCounts = Object.entries(mohafadaClubCount).map(([name, count]) => ({
          name,
          count,
        }));

        // Count the number of teams for each club and transform it into an array of objects
        
        const filteredClubs = await Club.findAll({
          where: {
            id: {
              [Op.in]: filters.clubs,
            },
          },
        });
        
        const teamCountByClub = await Promise.all(
          filteredClubs.map(async (club) => {
            const teamCount = await Team.count({
              where: {
                id_club: club.id, // Assuming there's a foreign key 'id_club' in the Team model
              },
            });
            return {
              name: club.name,
              count: teamCount,
            };
          })
        );

        // Count the number of players for each age group where their team is in the provided filters.teams
        const playerCountsByAge = await Promise.all(
          filters.age.map(async (age) => {
            const ageKey = AgeDict[age];
            const playerCount = await Players.count({
              where: {
                id_team: {
                  [Op.in]: filters.teams,
                },
                class: ageKey, // Assuming there's a field `ageGroup` in Players that matches keys from AgeDict
              },
            });
            return {
              name: age,
              count: playerCount,
            };
          })
        );

        // Count the number of matches for each year in the provided filters.saison and filters.leagues
        const matchCountsByYear = await Promise.all(
          filters.saison.map(async (year) => {
            const matchCount = await Match.count({
              where: {
                id_league: {
                  [Op.in]: filters.leagues,
                },
                date: {
                  [Op.like]: `${year}%`, // Assuming `date` is a string with format that starts with the year (e.g., '2023-XX-XX')
                },
              },
            });
            return {
              name: year,
              count: matchCount,
            };
          })
        );

        // Sort matchCountsByYear to ensure it starts from the smallest year
        matchCountsByYear.sort((a, b) => a.name.localeCompare(b.name));

        // Count the number of stadiums per mohafada
        const stadiumCountByMohafada = await Promise.all(
          filters.mohfada.map(async (mohafada) => {
            const stadiumCount = await Stadium.count({
              where: {
                mohafada,
              },
            });

            // Return only if stadiumCount is greater than 0
            if (stadiumCount > 0) {
              return {
                value: stadiumCount,
                name: mohafada,
              };
            }
            return null; // Return null for entries with no stadiums
          })
        );

        // Filter out null values from the result
        const filteredStadiumCountByMohafada = stadiumCountByMohafada.filter((entry) => entry !== null);

        // Fetch team and age statistics
        const teamAgeStats = await Promise.all(
          filters.teams.map(async (teamId) => {
            const team = await Team.findByPk(teamId);
            if (!team) return null;

            const club = await Club.findByPk(team.id_club);
            const teamAgeData = await Promise.all(
              filters.age.map(async (age) => {
                const ageKey = AgeDict[age];
                const playerCount = await Players.count({
                  where: {
                    id_team: teamId,
                    class: ageKey,
                  },
                });

                return {
                  clubName: club ? club.name : "Unknown Club",
                  teamName: team.name,
                  age,
                  countPlayer: playerCount,
                  trophy: 0, // Always zero
                  mohafada: club ? club.mohafada : "Unknown Mohafada", // Add mohafada from club
                };
              })
            );

            return teamAgeData;
          })
        );

        // Flatten the teamAgeStats array
        const flattenedTeamAgeStats = teamAgeStats.flat().filter((entry) => entry !== null);

        // Fetch general statistics
        const membersCount = await Members.count();
        const blogsCount = await Blog.count();
        const acceptedPlayerCount = await Players.count({
          where: {
            status: "accepted",
          },
        });
        const leaguesCount = await League.count();

        const GeneralStat = {
          Members: membersCount,
          blogs: blogsCount,
          acceptedPlayer: acceptedPlayerCount,
          leagues: leaguesCount,
        };

        
        return {
          success: true,
          message: 'Filters received and processed successfully',
          clubs,
          mohafadaClubCounts,
          teamCountByClub,
          playerCountsByAge,
          matchCountsByYear,
          stadiumCountByMohafada: filteredStadiumCountByMohafada,
          teamAgeStats: flattenedTeamAgeStats,
          GeneralStat,
        };
      } catch (error) {
        console.log('Error processing SearchData filters: ', error);
        throw new ApolloError("Failed to process filters for SearchData", "SEARCHDATA_FILTER_FAILED", { error });
      }
    },
    FetchAllData: async (parent, args, context, info) => {
      console.log("==== FetchAllData ====");
      try {
        // Fetch all clubs
        const clubs = await Club.findAll();

        // Count the number of clubs per mohafada
        const mohafadaClubCount = clubs.reduce((acc, club) => {
          acc[club.mohafada] = (acc[club.mohafada] || 0) + 1;
          return acc;
        }, {});

        // Transform mohafadaClubCount to an array of objects for GraphQL compatibility
        const mohafadaClubCounts = Object.entries(mohafadaClubCount).map(([name, count]) => ({
          name,
          count,
        }));

        // Count the number of teams for each club
        const teamCountByClub = await Promise.all(
          clubs.map(async (club) => {
            const teamCount = await Team.count({
              where: {
                id_club: club.id,
              },
            });
            return {
              name: club.name,
              count: teamCount,
            };
          })
        );

        // Count the number of players for each age group
        const AgeDict = {
          "الفريق الاول": "firstDegree",
          "تحت 23 سنة": "secondDegree",
          "تحت 18 سنة": "rookies",
          "تحت 16 سنة": "young",
        };

        const playerCountsByAge = await Promise.all(
          Object.entries(AgeDict).map(async ([ageLabel, ageKey]) => {
            const playerCount = await Players.count({
              where: {
                class: ageKey,
              },
            });
            return {
              name: ageLabel,
              count: playerCount,
            };
          })
        );

        // Count the number of matches for each year in the database
        const currentYear = new Date().getFullYear();
        const matchCountsByYear = await Promise.all(
          Array.from({ length: 5 }, (_, i) => currentYear - i).map(async (year) => {
            const matchCount = await Match.count({
              where: {
                date: {
                  [Op.like]: `${year}%`,
                },
              },
            });
            return {
              name: `${year}`,
              count: matchCount,
            };
          })
        );

        // Sort matchCountsByYear to ensure it starts from the smallest year
        matchCountsByYear.sort((a, b) => a.name.localeCompare(b.name));

        // Count the number of stadiums per mohafada
        const stadiumCountByMohafada = await Promise.all(
          clubs.map(async (club) => {
            const stadiumCount = await Stadium.count({
              where: {
                mohafada: club.mohafada,
              },
            });
            return {
              value: stadiumCount,
              name: club.mohafada,
            };
          })
        );

        // Filter out entries with zero stadiums
        const filteredStadiumCountByMohafada = stadiumCountByMohafada.filter((entry) => entry.value > 0);

        // Fetch team and age statistics
        const teamAgeStats = await Promise.all(
          clubs.map(async (club) => {
            const teams = await Team.findAll({ where: { id_club: club.id } });
            const teamAgeData = await Promise.all(
              teams.map(async (team) => {
                return await Promise.all(
                  Object.entries(AgeDict).map(async ([ageLabel, ageKey]) => {
                    const playerCount = await Players.count({
                      where: {
                        id_team: team.id,
                        class: ageKey,
                      },
                    });
                    return {
                      clubName: club.name,
                      teamName: team.name,
                      age: ageLabel,
                      countPlayer: playerCount,
                      trophy: 0,
                      mohafada: club.mohafada,
                    };
                  })
                );
              })
            );

            return teamAgeData.flat();
          })
        );

        // Flatten the teamAgeStats array
        const flattenedTeamAgeStats = teamAgeStats.flat().filter((entry) => entry !== null);

        // Fetch general statistics
        const membersCount = await Members.count();
        const blogsCount = await Blog.count();
        const acceptedPlayerCount = await Players.count({
          where: {
            status: "accepted",
          },
        });
        const leaguesCount = await League.count();

        const GeneralStat = {
          Members: membersCount,
          blogs: blogsCount,
          acceptedPlayer: acceptedPlayerCount,
          leagues: leaguesCount,
        };

        return {
          success: true,
          message: 'All data fetched successfully',
          clubs,
          mohafadaClubCounts,
          teamCountByClub,
          playerCountsByAge,
          matchCountsByYear,
          stadiumCountByMohafada: filteredStadiumCountByMohafada,
          teamAgeStats: flattenedTeamAgeStats,
          GeneralStat,
        };
      } catch (error) {
        console.log('Error fetching all data: ', error);
        throw new ApolloError("Failed to fetch all data", "FETCH_ALL_DATA_FAILED", { error });
      }
    },
  },
};
