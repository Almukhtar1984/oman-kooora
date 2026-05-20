import { gql } from "@apollo/client";

export const UpdateMatchState = gql`
    mutation UpdateMatchState($id: ID!, $state: String!) {
        updateMatchState(id: $id, state: $state) {
            status
        }
    }
`;
