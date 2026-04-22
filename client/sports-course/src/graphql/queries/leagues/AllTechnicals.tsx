import {gql} from "@apollo/client";

export const AllTechnicals = gql`
    query AllTechnicalApparatus($idTeam: ID) {
        allTechnicalApparatus(idTeam: $idTeam) {
            id
            occupation
            classification
            membership_date
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
                phone
            }
            createdAt
            updatedAt
        }
    }
`;