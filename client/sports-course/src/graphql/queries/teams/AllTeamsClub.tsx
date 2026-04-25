import { gql } from "@apollo/client";

export const AllTeamsClub = gql`
    query AllTeamClub($idClub: ID) {
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