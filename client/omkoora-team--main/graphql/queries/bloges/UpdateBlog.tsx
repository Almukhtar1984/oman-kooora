import {gql} from "@apollo/client";

export const UpdateBlog = gql`
    mutation UpdateBlog($id: ID!, $content: contentBlog!) {
        updateBlog(id: $id, content: $content) {
            status
        }
    }
`;