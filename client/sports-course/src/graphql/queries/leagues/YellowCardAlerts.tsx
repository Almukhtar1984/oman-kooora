import { gql } from "@apollo/client";

export const YellowCardAlerts = gql`
    query YellowCardAlerts($leagueId: ID!) {
        yellowCardAlerts(leagueId: $leagueId) {
            player
            number
            yellowCount
            team {
                id
                name
            }
            matches {
                id
                date
                firstTeam
                secondTeam
            }
        }
    }
`;
