import { gql } from "@apollo/client";

// كل ما ينتظر الفريق نفسه، بعدّاد واحد محسوب من السجلات المعلّقة نفسها.
export const TeamPendingRequests = gql`
    query TeamPendingRequests {
        teamPendingRequests {
            total
            groups { key label href count }
        }
    }
`;
