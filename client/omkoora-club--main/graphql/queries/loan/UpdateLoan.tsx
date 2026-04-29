import { gql } from "@apollo/client";

export const UpdateLoan = gql`
    mutation UpdateLoan($id: ID!, $date_start: String, $date_end: String) {
        updateLoan(id: $id, date_start: $date_start, date_end: $date_end) {
            status
        }
    }
`;