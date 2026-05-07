import { gql } from "@apollo/client";

export const DeleteSanction = gql`
    mutation DeleteSanction($id: ID!) {
        deleteSanction(id: $id) {
            status
        }
    }
`;