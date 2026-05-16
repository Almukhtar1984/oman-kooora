import {gql} from "@apollo/client";

export const ChangeStatusTechnicalApparatusBulk = gql`
    mutation ChangeStatusTechnicalApparatusBulk($ids: [ID!]!, $status: String!, $note: String) {
        changeStatusTechnicalApparatusBulk(ids: $ids, status: $status, note: $note) {
            success
            total
        }
    }
`;
