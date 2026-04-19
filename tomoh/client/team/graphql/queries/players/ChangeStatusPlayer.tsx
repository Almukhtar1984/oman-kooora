import {gql} from "@apollo/client";

export const ChangeStatusPlayer = gql`
    mutation ChangeStatusPlayer($id: ID!, $status: String!, $note: String) {
        changeStatusPlayer(id: $id, status: $status, note: $note) {
            status
        }
    }
`;