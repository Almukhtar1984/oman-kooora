import {gql} from "@apollo/client";

export const TeamDetails = gql`
    query TeamDetails($id: ID!) {
        team(id: $id) {
            id
            name
            category
            logo
            phone
            manager_name
            activities
            account_status
            code
            enableAddPlayer
            createdAt
            updatedAt
            admin {
                id
                email
                person {
                    id
                    personal_picture
                    first_name
                    second_name
                    third_name
                    tribe
                    phone
                    card_number
                }
            }
        }
        statisticsTeam(idTeam: $id) {
            numberPlayers
            numberPlayersWaiting
            numberPlayersRejected
            numberPlayersAccepted
            numberTechnicales
            numberMembers
            numberStadiums
        }
    }
`;
