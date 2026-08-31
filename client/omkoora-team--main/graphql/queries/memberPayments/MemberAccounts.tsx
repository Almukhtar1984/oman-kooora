import {gql} from "@apollo/client";

export const MemberAccounts = gql`
    query MemberAccountsTeam($idTeam: ID) {
        memberAccountsTeam(idTeam: $idTeam) {
            totalPaid
            member {
                id
                occupation
                classification
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
