import {gql} from "@apollo/client";

export const AddComment = gql`
    mutation CreateComment($content: contentComment!) {
        createComment(content: $content) {
            id
        }
    }
`;