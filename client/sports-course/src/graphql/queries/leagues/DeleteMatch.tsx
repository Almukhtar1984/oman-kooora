import { gql } from "@apollo/client";

export const DeleteMatch = gql`
    mutation DeleteMatch($id: ID!) {
        deleteMatch(id: $id) {
            status
        }
    }
`;