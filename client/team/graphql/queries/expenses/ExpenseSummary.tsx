import { gql } from "@apollo/client";

export const ExpenseSummary = gql`
    query ExpenseSummary($idClub: ID, $idTeam: ID) {
        expenseSummary(idClub: $idClub, idTeam: $idTeam) {
            profits
            expenses
            net
        }
    }
`;