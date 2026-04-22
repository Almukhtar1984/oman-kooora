import {gql} from "@apollo/client";

export const AllRequests = gql`
    query AllRequests($idPlayer: ID, $type: String) {
        allRequests(idPlayer: $idPlayer, type: $type) {
            id
            content
            type
            status
            note
            player {
                id
            }
            createdAt
            updatedAt
        }
    }
`;