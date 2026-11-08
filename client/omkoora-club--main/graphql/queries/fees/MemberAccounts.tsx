import { gql } from "@apollo/client";

// «حسابات الأعضاء» في النادي: أعضاء فرقه كلها، كل شخص مرة واحدة.
export const ClubMemberAccounts = gql`
    query ClubMemberAccounts($year: Int) {
        clubMemberAccounts(year: $year) {
            year
            totalThisYear
            members
            paidMembers
            rows {
                key
                name
                card_number
                membership_number
                teams
                kinds
                paidThisYear
                totalPaid
                lastPaymentDate
                subscribedThisYear
                payments {
                    amount
                    date
                    source
                    team
                    note
                }
            }
        }
    }
`;
