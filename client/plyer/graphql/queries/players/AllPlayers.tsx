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
            nationalID
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
            createdAt
            updatedAt
        }
    }
`;