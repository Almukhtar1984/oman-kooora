import { gql } from "@apollo/client";

// Public, print-ready roster for one participating team: players + technical
// staff, ready to render as a formal team sheet.
export const TeamRoster = gql`
    query TeamRoster($id: ID!) {
        teamRoster(id: $id) {
            teamName
            leagueName
            players {
                number
                name
                position
            }
            staff {
                name
                job
            }
        }
    }
`;
