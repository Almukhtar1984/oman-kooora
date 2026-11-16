import { gql } from "@apollo/client";

// «حسابات الأعضاء» في النادي: أعضاء فرقه كلها، كل شخص مرة واحدة.
export const ClubMemberAccounts = gql`
    query ClubMemberAccounts($year: Int) {
        clubMemberAccounts(year: $year) {
            year
            totalThisYear
            teamThisYear
            clubThisYear
            members
            paidMembers
            teams {
                team
                members
                paidMembers
                teamThisYear
                clubThisYear
            }
            rows {
                key
                name
                card_number
                membership_number
                teams
                kinds
                paidThisYear
                paidToTeamThisYear
                paidToClubThisYear
                totalPaid
                lastPaymentDate
                subscribedThisYear
                payments {
                    amount
                    date
                    source
                    party
                    team
                    note
                }
            }
        }
    }
`;
