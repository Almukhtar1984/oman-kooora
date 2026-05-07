import {gql} from "@apollo/client";

export const AddExpense = gql`
    mutation CreateExpense($content: contentExpense!) {
        createExpense(content: $content) {
            id
            value
            note

            club {
                id
            }
            team {
                id
            }
            
            createdAt
            updatedAt
        }
    }
`;