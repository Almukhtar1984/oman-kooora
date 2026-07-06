import { gql } from "@apollo/client";

// Public, print-ready lineup for one match: both teams and their players with
// أساسي / احتياط status, ready to render as a formal match sheet.
export const MatchLineup = gql`
    query MatchLineup($id: ID!) {
        matchLineup(id: $id) {
            id
            date
            leagueName
            firstTeamName
            secondTeamName
            firstTeamPlayers {
                name
                number
                position
                starter
                sub
            }
            secondTeamPlayers {
                name
                number
                position
                starter
                sub
            }
        }
    }
`;
