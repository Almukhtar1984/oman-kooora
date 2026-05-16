import {gql} from "@apollo/client";

export const ChangeStatusMembersBulk = gql`
    mutation ChangeStatusMembersBulk($ids: [ID!]!, $status: String!, $note: String) {
        changeStatusMembersBulk(ids: $ids, status: $status, note: $note) {
            success
            total
        }
    }
`;
