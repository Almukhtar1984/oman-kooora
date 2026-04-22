import {gql} from "@apollo/client";

export const DeleteExpense = gql`
    mutation DeleteExpense($id: ID!) {
        deleteExpense(id: $id) {
            status
        }
    }
`;