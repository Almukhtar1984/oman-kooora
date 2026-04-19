import {gql} from "@apollo/client";

export const DeleteForm = gql`
    mutation DeleteForm($id: ID!) {
        deleteForm(id: $id) {
            status
        }
    }
`;