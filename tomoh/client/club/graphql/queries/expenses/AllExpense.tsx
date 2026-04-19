import {gql} from "@apollo/client";

export const AllExpense = gql`
    query AllExpenses($idClub: ID) {
        allExpensesClub(idClub: $idClub) {
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