import { gql } from "@apollo/client";

export const UpdatePassword = gql`
  mutation UpdatePassword($oldPassword: String!, $newPassword: String!) {
    updatePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      status
    }
  }
`;
