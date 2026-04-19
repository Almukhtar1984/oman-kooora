import {gql} from "@apollo/client";

export const AllPlayers = gql`
    query AllPlayersClub($idClub: ID) {
        allPlayersClub(idClub: $idClub) {
            id
            activity
            player_center
            job
            status
            note
            class
            nationalID
            nationalIDBack
            parentApproval
            
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
            attachmentsPlayer {
                id
                content
            }
            transfer {
                id
                status
                type
                team_from {
                    id
                    name
                }
                team_to {
                    id
                    name
                }
            }
            createdAt
            updatedAt
        }
    }
`;