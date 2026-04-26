import {gql} from "@apollo/client";

export const GetRanking = gql`
    query GetRanking($leagueId: ID!) {
        calculatePoints(leagueId: $leagueId) {
                team {
          id
          name
          
        }
        points
        matchesPlayed
        group
        losses
        draws
        wins
      }
        
    }
`;