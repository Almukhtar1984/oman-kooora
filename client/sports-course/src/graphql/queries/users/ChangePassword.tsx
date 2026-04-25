import { gql } from "@apollo/client";

export const CHANGE_PW = gql`
  mutation ChangePassword($content: contentChangePassword) {
    changePassword(content: $content) {
      status
    }
  }
`;