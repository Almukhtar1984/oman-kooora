import { gql } from "@apollo/client";

export const DeleteTransfer = gql`
    mutation DeleteTransfer($id: ID!) {
        deleteTransfer(id: $id) {
            status
        }
    }
`;
