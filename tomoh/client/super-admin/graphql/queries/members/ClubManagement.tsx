import {gql} from "@apollo/client";

export const ClubManagement = gql`
    query ClubManagement($id: ID!) {
        clubManagement(id: $id) {
            id
            membership_date
            membership_date_end
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
                user {
                    id
                    email
                }
            }
        }
    }
`;