import {gql} from "apollo-server-express";

// أيقونة «الطلبات»: كل ما ينتظر قرار النادي، بعدّاد واحد.
// العدّاد محسوب من السجلات المعلّقة نفسها، فلا ينزل بفتح القائمة — بل باتخاذ
// الإجراء عليها.
export const typeDefs = gql`

    extend type Query {
        clubPendingRequests: PendingRequests @auth(requires: user)
    }

    type PendingRequests {
        total:  Int
        groups: [PendingRequestGroup!]!
    }

    type PendingRequestGroup {
        key:   String
        label: String
        href:  String
        count: Int
    }
`;
