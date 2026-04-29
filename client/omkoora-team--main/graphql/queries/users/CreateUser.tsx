import {gql} from "@apollo/client";

export const Create_User = gql`
  mutation CreateUser($content: contentUser!) {
    createUser(content: $content) {
      id
      email
      role
    }
  }
`;
