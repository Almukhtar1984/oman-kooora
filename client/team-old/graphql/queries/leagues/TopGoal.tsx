import {gql} from "@apollo/client";


export const TopGoal = gql`
    query TopGoal($leagueId: ID!) {
        calculateGoalPlayer(leagueId: $leagueId) {
            team 
            Goal
            PlayerName
            PlayerID{
            id
            player{
                id
                person{
                first_name
                second_name
                third_name
                
                }
            }
            }
      }}
`;