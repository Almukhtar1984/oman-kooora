import {gql} from "@apollo/client";

export const AllRequests = gql`
    query AllRequests($idTeam: ID) {
        allRequestsTeam(idTeam: $idTeam) {
            id
            content
            type
            status
            note
            player {
                id

                person {
                    id
                    personal_picture
                    first_name
                    second_name
                    third_name
                    tribe
                    phone
                }
            }
            createdAt
            updatedAt
        }
    }
`;