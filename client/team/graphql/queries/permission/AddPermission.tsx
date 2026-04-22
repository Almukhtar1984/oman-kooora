import {gql} from "@apollo/client";

export const AddPermission = gql`
    mutation CreatePermission($content: contentPermission!) {
        createPermission(content: $content) {
            id
            
            createdAt
        }
    }
`;