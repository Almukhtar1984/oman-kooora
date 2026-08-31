import {gql} from "@apollo/client";

export const PlayerAccounts = gql`
    query PlayerAccountsTeam($idTeam: ID) {
        playerAccountsTeam(idTeam: $idTeam) {
            totalPaid
            player {
                id
                player_center
                person {
                    id
                    first_name
                    second_name
                    third_name
                    tribe
                    phone
                    card_number
                }
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
