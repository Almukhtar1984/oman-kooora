import {gql} from "@apollo/client";

export const AllExpense = gql`
    query AllExpenses($idTeam: ID) {
        allExpensesTeam(idTeam: $idTeam) {
            id
            value
            note
            attachment

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