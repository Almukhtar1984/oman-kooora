import {gql} from "@apollo/client";

export const ChangeStatusTechnicalApparatus = gql`
    mutation ChangeStatusTechnicalApparatus($id: ID!, $status: String!, $note: String) {
        changeStatusTechnicalApparatus(id: $id, status: $status, note: $note) {
            status
        }
    }
`;