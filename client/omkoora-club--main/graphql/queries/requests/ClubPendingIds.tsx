import { gql } from "@apollo/client";

// سجلات مجموعةٍ من عدّاد «الطلبات» — ما تفتح عليه الصفحة حين يأتيها النادي منه.
export const ClubPendingIds = gql`
    query ClubPendingIds($key: String!) {
        clubPendingIds(key: $key)
    }
`;
