import { gql } from "@apollo/client";

// كل ما ينتظر قرار النادي، بعدّاد واحد محسوب من السجلات المعلّقة نفسها.
export const ClubPendingRequests = gql`
    query ClubPendingRequests {
        clubPendingRequests {
            total
            groups { key label href count }
        }
    }
`;
