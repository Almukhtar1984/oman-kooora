import {gql} from "@apollo/client";

export const DeleteRequest = gql`
    mutation DeleteRequest($id: ID!) {
        deleteRequest(id: $id) {
            status
        }
    }
`;