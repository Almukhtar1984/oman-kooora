import { gql } from "@apollo/client";

export const DeleteScorerMatch = gql`
    mutation DeleteScorerMatch($id: ID!) {
        deleteScorerMatch(id: $id) {
            status
        }
    }
`;
