import { gql,  } from "@apollo/client";

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      id
      email
      role
      activation
      createdAt
      updatedAt

      person {
        id
        personal_picture
        first_name
        second_name
        third_name
        tribe
        phone
        card_number
        date_birth
        createdAt
        updatedAt

        player {
          id
        }
      }
    }
  }
`;