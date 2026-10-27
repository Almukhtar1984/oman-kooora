import { gql } from "@apollo/client";

// العضوية الموحّدة: صفّ واحد لكل شخص، يحمل تصنيفاته كلها.
export const ClubMembership = gql`
    query ClubMembership($kind: String, $status: String, $search: String, $page: Int, $limit: Int) {
        clubMembership(kind: $kind, status: $status, search: $search, page: $page, limit: $limit) {
            total
            page
            limit
            counts { kind label count }
            rows {
                id
                kind
                label
                status
                full_name
                card_number
                phone
                membership_number
                membership_date
                team_id
                team_name
            }
        }
    }
`;
