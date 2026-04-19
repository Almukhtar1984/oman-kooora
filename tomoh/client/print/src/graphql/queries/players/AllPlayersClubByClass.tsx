import {gql} from "@apollo/client";

export const AllPlayersClub = gql`
    query AllPlayersClub($idClub: ID, $className: String) {
        allPlayersClub(idClub: $idClub, className: $className) {
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