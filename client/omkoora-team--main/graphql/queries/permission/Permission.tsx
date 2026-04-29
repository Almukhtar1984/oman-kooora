import {gql} from "@apollo/client";

export const Permission = gql`
    query Permission($id: ID) {
        permission(id: $id) {
            id
            id
            
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

            user {
                id
                email
                role
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

                    team {
                        id
                        name
                    }
                }
            }

            createdAt
            updatedAt
        }
    }
`;