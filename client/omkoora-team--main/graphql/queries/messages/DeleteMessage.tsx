import {gql} from "@apollo/client";

export const DeleteMessage = gql`
    mutation DeleteMessage($id: ID!) {
        deleteMessage(id: $id) {
            status
        }
    }
`;