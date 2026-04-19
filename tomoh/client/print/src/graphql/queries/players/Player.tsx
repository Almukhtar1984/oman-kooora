import {gql} from "@apollo/client";

export const Player = gql`
    query Player($id: ID!) {
        player(id: $id) {
            id
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