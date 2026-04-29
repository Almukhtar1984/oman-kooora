import {gql} from "@apollo/client";

export const UpdateMatch = gql`
    mutation UpdateMatch($id: ID!, $content: contentMatch!) {
        updateMatch(id: $id, content: $content) {
            status
        }
    }
`;