import {gql} from "@apollo/client";

export const ChangeStatusMember = gql`
    mutation ChangeStatusMember($id: ID!, $status: String!, $note: String) {
        changeStatusMember(id: $id, status: $status, note: $note) {
            status
        }
    }
`;