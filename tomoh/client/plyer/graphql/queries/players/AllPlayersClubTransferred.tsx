import {gql} from "@apollo/client";

export const AllPlayersClubTransferred = gql`
    query AllPlayersClubTransferred($idClub: ID) {
        allPlayersClubTransferred(idClub: $idClub) {
            id
            activity
            player_center
            job
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
            lastTransfer {
                id
                status
                team_from {
                    id
                    name
                }
                team_to {
                    id
                    name
                }
                
                id_player
                createdAt
                updatedAt
            }
            createdAt
            updatedAt
        }
    }
`;