import {gql} from "@apollo/client";

export const Request = gql`
    query Member($id: ID!) {
        request(id: $id) {
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