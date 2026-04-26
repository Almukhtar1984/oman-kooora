import { gql } from "@apollo/client";

export const ConvertTechnicalToPlayer = gql`
    mutation ConvertTechnicalToPlayer(
        $idTechnical: ID!
        $activity: String!
        $player_center: String!
        $class: String!
    ) {
        convertTechnicalToPlayer(
            idTechnical: $idTechnical
            activity: $activity
            player_center: $player_center
            class: $class
        ) {
            id
            activity
            player_center
            job
            class
            status
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
