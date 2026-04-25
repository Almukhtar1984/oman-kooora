import { gql } from "@apollo/client";

export const Update_User = gql`
  mutation UpdateUser($id: ID!, $content: contentUser!) {
    updateUser(id: $id, content: $content) {
      status
    }
  }
`;