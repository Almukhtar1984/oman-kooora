import { gql } from "@apollo/client";

export const Create_User = gql`
  mutation CreateUser($content: contentUser) {
    createUser(content: $content) {
      token
      user {
        id
        user_name
        role
        activation
        person {
          id
          first_name
          last_name
          email
          phone
          address
          ID_number
          createdAt
          updatedAt
        }
      }
    }
  }
`;
