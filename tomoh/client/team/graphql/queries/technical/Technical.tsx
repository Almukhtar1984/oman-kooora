import {gql} from "@apollo/client";

export const Technical = gql`
    query TechnicalApparatus($id: ID!) {
        technicalApparatus(id: $id) {
            id
            occupation
            classification
            membership_date
            membership_date_end
            paid
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