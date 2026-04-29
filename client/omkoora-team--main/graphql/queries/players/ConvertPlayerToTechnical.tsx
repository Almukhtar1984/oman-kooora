import { gql } from "@apollo/client";

export const ConvertPlayerToTechnical = gql`
    mutation ConvertPlayerToTechnical(
        $idPlayer: ID!
        $classification: String!
        $membership_date: String!
        $membership_date_end: String!
    ) {
        convertPlayerToTechnical(
            idPlayer: $idPlayer
            classification: $classification
            membership_date: $membership_date
            membership_date_end: $membership_date_end
        ) {
            id
            classification
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
            }
            team {
                id
                name
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
