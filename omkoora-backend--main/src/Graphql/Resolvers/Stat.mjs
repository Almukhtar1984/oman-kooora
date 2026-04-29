import { ApolloError } from 'apollo-server-express';
import dotenv from 'dotenv';
import { Op } from 'sequelize'; // Import Sequelize operators

import logger from "../../Config/logger.mjs";
import { Club, Team, League, Players, Match, Stadium, Members, Blog } from '../../Models/index.mjs';

dotenv.config();

export const resolvers = {
  Query: {
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
