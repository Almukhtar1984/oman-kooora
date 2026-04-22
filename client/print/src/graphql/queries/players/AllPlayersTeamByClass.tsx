import {gql} from "@apollo/client";

export const AllPlayersTeamByClass = gql`
    query AllPlayersTeamByClass($idTeam: ID, $className: String) {
        allPlayersByClass(idTeam: $idTeam, className: $className) {
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
            }
            createdAt
            updatedAt
        }
    }
`;