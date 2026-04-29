import {gql} from "@apollo/client";

export const AllTeams = gql`
    query AllTeam($idClub: ID) {
        allTeam(idClub: $idClub) {
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
                    member {
                        id
                    }
                }
            }
        }
    }
`;