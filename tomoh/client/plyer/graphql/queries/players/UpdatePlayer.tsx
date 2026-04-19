import {gql} from "@apollo/client";

export const UpdatePlayer = gql`
    mutation UpdatePlayer($id: ID!, $status: String!, $note: String) {
        changeStatusPlayer(id: $id, status: $status, note: $note) {
            status
        }
    }
`;