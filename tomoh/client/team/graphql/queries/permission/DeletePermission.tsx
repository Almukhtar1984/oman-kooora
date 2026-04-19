import {gql} from "@apollo/client";

export const DeletePermission = gql`
    mutation DeletePermission($id: ID!) {
        deletePermission(id: $id) {
            status
        }
    }
`;