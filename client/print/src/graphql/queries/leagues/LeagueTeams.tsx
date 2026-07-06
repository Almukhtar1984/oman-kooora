import { gql } from "@apollo/client";

// Public (unauthenticated) list of every team enrolled in a league — mirrors
// participatingPlayersByLeague so the print tab works from a plain link.
export const LeagueTeams = gql`
    query ParticipatingTeamsByLeague($idLeague: ID!) {
        participatingTeamsByLeague(idLeague: $idLeague) {
            id
            group
            status
            league {
                id
                name
            }
            team {
                id
                name
                category
                club {
                    id
                    name
                }
            }
        }
    }
`;
