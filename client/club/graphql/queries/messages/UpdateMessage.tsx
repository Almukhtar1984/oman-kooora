import {gql} from "@apollo/client";

export const UpdateMessage = gql`
    mutation UpdateMessage($id: ID!, $content: contentMessage!) {
        updateMessage(id: $id, content: $content) {
            status
        }
    }
`;