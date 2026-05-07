import { gql } from "@apollo/client";

export const SanctionLast = gql`
    query SanctionLast($id_player: ID!) {
        SanctionLast(id_player: $id_player) {
            id
            note
            date_from
            date_to
            player {
                id
                person {
                    first_name
                    second_name
                    third_name
                }
            }
        
        }
    }
`;
