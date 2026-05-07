import { gql } from "@apollo/client";

export const statPlayer = gql`
  query statPlayer($id: ID!) {
    statPlayer(id: $id) {
      team {
        id
        name
      }
      Person {
        id
        first_name
        second_name
        third_name
      }
      Goal  # Returns an integer representing the number of goals
      Participation {
        id
        participating_team {
          id
          league {
            id
            name
          }
        }
      }
      Sanctions {
        id
      }
      participatingPlayerMatchCount  # Fetch the count of ParticipatingPlayersMatch instances
    }
  }
`;
