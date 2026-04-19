import {gql} from "@apollo/client";

export const UpdatePermission = gql`
    mutation UpdatePermission($id: ID!, $content: contentPermission!) {
        updatePermission(id: $id, content: $content) {
            status
        }
    }
`;