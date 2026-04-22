import {gql} from "@apollo/client";

export const Assembly = gql`
    query Assembly($id: ID) {
        assembly(id: $id) {
            id
            personal_picture
            first_name
            second_name
            third_name
            tribe
            date_birth
            card_number
            phone
            type
            nationalID
            membership_date
            gender
            subscription_date
            
            team {
                id
                name
                logo
                club {
                    id
                    name
                    logo
                }
            }
            createdAt
            updatedAt
        }
    }
`;