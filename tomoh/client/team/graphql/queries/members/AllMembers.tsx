import {gql} from "@apollo/client";

export const AllMembers = gql`
    query AllMember($idTeam: ID) {
        allMembers(idTeam: $idTeam) {
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
            }
            createdAt
            updatedAt
        }
    }
`;