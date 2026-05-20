import { gql } from "@apollo/client";

export const CardsByLeague = gql`
    query GetCardsByLeague($leagueId: ID!) {
        getCardsByLeague(leagueId: $leagueId) {
            yellowCards {
                player
                number
                count
                team {
                    id
                    name
                }
            }
            redCards {
                player
                number
                count
                team {
                    id
                    name
                }
            }
        }
    }
`;
