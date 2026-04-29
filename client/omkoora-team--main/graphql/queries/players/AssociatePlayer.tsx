import { gql } from "@apollo/client";

export const AssociatePlayer = gql`
  mutation AssociatePlayer($id_player: ID!, $id_team: ID!) {
    associatePlayer(id_player: $id_player, id_team: $id_team) {
      status
    }
  }
`;
