import { gql } from "@apollo/client";

export const GetCardsByLeague = gql`
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
