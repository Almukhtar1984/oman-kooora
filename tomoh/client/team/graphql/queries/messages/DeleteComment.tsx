import {gql} from "@apollo/client";

export const DeleteComment = gql`
    mutation DeleteComment($id: ID!) {
        deleteComment(id: $id) {
            status
        }
    }
`;