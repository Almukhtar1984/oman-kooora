import {gql} from "@apollo/client";

export const PlayerPayments = gql`
    query PlayerPayments($idPlayer: ID) {
        playerPayments(idPlayer: $idPlayer) {
            totalPaid
            player {
                id
            }
            payments {
                id
                amount
                note
                payment_date
                createdAt
            }
        }
    }
`;
