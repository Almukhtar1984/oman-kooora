import { gql } from "@apollo/client";

// طلب استقالة لاعب (إخلاء طرف) من الفريق — يذهب إلى النادي على طريق الطلبات:
// قبول مبدئي، فرسوم الاستقالة، فاعتماد نهائي يصير به اللاعب حراً.
export const CreatePlayerRelease = gql`
    mutation CreatePlayerRelease($content: contentPlayerRelease!) {
        createPlayerRelease(content: $content) {
            id
            status
            requested_at
        }
    }
`;
