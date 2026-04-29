//AllTransferTeam
import {gql} from "@apollo/client";

export const AllTransferTeam = gql`
    query AllTransferTeam($idTeam: ID, $transitionType: [String]) {
        allTransferTeam(idTeam: $idTeam, transitionType: $transitionType) {
            id
            status
            transition_type
            date_start
            date_end
            type
            
            team_from {
                id
                name
            }
            team_to {
                id
                name
            }

            player {
                id
                activity
                player_center
                job
                class
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
            }
            
            createdAt
            updatedAt
        }
    }
`;