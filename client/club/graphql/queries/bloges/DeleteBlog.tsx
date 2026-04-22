import {gql} from "@apollo/client";

export const DeleteBlog = gql`
    mutation DeleteBlog($id: ID!) {
        deleteBlog(id: $id) {
            status
        }
    }
`;