import { gql } from "@apollo/client";

export const ALL_USERS = gql`
  query AllUsers {
    allUsers {
      id
      name
      role
      activation
      email
      phone
      personal_picture
      display_language
      notifications
      createdAt
      updatedAt
    }
  }
`;