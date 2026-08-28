import {gql} from "@apollo/client";

// Single technical-staff record, shaped like the player/member card queries so
// the shared CardTemplate can render it unchanged.
export const Technical = gql`
    query TechnicalApparatus($id: ID) {
        technicalApparatus(id: $id) {
            id
            occupation
            classification
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
        }
    }
`;
