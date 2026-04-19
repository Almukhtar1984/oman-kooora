import {gql} from "@apollo/client";

export const Expense = gql`
    query Expense($id: ID) {
        expense(id: $id) {
            id
            value
            note

#            club {
#                id
#                logo
#                name
#            }
#            team {
#                id
#                logo
#                name
#            }

            createdAt
            updatedAt
        }
    }
`;