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

      
      permission {
        teams
        members
        technicals
        players
        transfer_players
        loan_players
        assembly
        inbox
        outbox
        meeting
        blogs
        forms
        permissions
      }

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
        
        clubManagement {
          id
          role
          club {
            id
            name
            logo
          }
        }
      }
    }
  }
`;