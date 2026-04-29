import {gql} from "@apollo/client";

export const AllClubManagement = gql`
    query AllClubManagement($idClub: ID) {
        allClubManagement(idClub: $idClub) {
            id
            membership_date
            membership_date_end
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
                user {
                    id
                    email
                }
            }
            createdAt
            updatedAt
        }
    }
`;