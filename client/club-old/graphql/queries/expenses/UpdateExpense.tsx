import {gql} from "@apollo/client";

export const UpdateExpense = gql`
    mutation UpdateExpense($id: ID!, $content: contentExpense!) {
        updateExpense(id: $id, content: $content) {
            status
        }
    }
`;