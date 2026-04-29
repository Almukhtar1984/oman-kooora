import {gql} from "@apollo/client";

export const UpdateTransfer = gql`
    mutation UpdateTransfer($id: ID!, $content: contentTransfer!) {
        updateTransfer(id: $id, content: $content) {
            status
        }
    }
`;