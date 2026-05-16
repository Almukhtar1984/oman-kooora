import {gql} from "@apollo/client";

export const ChangeStatusPlayersBulk = gql`
    mutation ChangeStatusPlayersBulk($ids: [ID!]!, $status: String!, $note: String) {
        changeStatusPlayersBulk(ids: $ids, status: $status, note: $note) {
            success
            total
        }
    }
`;
