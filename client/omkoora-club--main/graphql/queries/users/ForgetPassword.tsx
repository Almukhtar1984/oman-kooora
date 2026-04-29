import {gql} from "@apollo/client";

export const FORGET_PW = gql`
  mutation ForgetPassword($email: String) {
    forgetPassword(email: $email) {
      status
    }
  }
`;