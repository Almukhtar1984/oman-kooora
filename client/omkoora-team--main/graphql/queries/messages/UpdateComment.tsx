import {gql} from "@apollo/client";

export const UpdateComment = gql`
    mutation UpdateComment($id: ID!, $content: contentComment!) {
        updateComment(id: $id, content: $content) {
            status
        }
    }
`;