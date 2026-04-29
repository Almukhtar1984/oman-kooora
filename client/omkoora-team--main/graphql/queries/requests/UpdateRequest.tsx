import {gql} from "@apollo/client";

export const UpdateRequest = gql`
    mutation UpdateRequest($id: ID!, $content: contentRequest!) {
        updateRequest(id: $id, content: $content) {
            status
        }
    }
`;