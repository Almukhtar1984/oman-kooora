import { gql } from "@apollo/client";

export const FreePlayer = gql`
  mutation FreePlayer($id: ID!) {
    freePlayer(id: $id) {
      status
    }
  }
`;
