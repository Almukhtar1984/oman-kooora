import {gql} from "@apollo/client";

export const Member = gql`
    query Member($id: ID) {
        member(id: $id) {
            id
            occupation
            classification
            membership_date
            membership_date_end
            paid
            status
            note
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
            }
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