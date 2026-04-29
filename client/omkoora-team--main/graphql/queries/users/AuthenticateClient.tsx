import {gql} from "@apollo/client";

export const AUTH_USER = gql`
  mutation authenticateUser($content: loginInfo) {
    authenticateUser(content: $content) {
      token
    }
  }
`;