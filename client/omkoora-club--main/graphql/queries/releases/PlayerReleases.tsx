import { gql } from "@apollo/client";

// طلبات الاستقالة / إخلاء الطرف — النادي يرى طلباته كلها.
export const AllPlayerReleases = gql`
    query AllPlayerReleases($idTeam: ID, $status: String) {
        allPlayerReleases(idTeam: $idTeam, status: $status) {
            id
            reason
            letter
            status
            note
            requested_at
            decided_at
            createdAt
            team { id name }
            player {
                id
                person { id first_name second_name third_name tribe card_number }
            }
        }
    }
`;

// رفع طلب إخلاء طرف مع خطاب الاستقالة.
export const CreatePlayerRelease = gql`
    mutation CreatePlayerRelease($content: contentPlayerRelease!) {
        createPlayerRelease(content: $content) {
            id
            status
            requested_at
        }
    }
`;

// قرار النادي: accepted (يتحرّر اللاعب) أو rejected مع ذكر السبب.
export const DecidePlayerRelease = gql`
    mutation DecidePlayerRelease($id: ID!, $status: String!, $note: String) {
        decidePlayerRelease(id: $id, status: $status, note: $note) {
            status
            message
        }
    }
`;
