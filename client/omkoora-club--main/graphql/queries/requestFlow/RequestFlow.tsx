import { gql } from "@apollo/client";

// مسار الطلب من جانب النادي.
//
// الطلب الواحد يمشي طريقاً واحداً: مراجعة مبدئية، فاستكمال إجراءات، فمطالبة
// بالرسوم، فاعتماد نهائي. وهذه الاستعلامات هي ذلك الطريق — والإجراء يُبنى من
// `actions` التي يرسلها الخادم، فلا يُعرض زرّ يُرفض ضغطه.

// طلبات النادي — بلا أحداث: الخط يُجلب للطلب الذي يُفتح وحده.
export const MyRequestFlows = gql`
    query MyRequestFlows($stage: String, $request_type: String) {
        myRequestFlows(stage: $stage, request_type: $request_type) {
            id
            request_type
            request_label
            subject
            entity_type
            entity_id
            stage
            label
            also
            actor
            done
            reason
            createdAt
            payment {
                id
                label
                amount
                status
            }
            actions {
                to
                label
                needsReason
            }
        }
    }
`;

// الطلب الواحد بخطّه كاملاً — يُجلب حين يُفتح الدرج.
export const RequestFlowTrack = gql`
    query RequestFlow($entity_type: String!, $entity_id: ID!) {
        requestFlow(entity_type: $entity_type, entity_id: $entity_id) {
            id
            request_type
            request_label
            subject
            entity_type
            entity_id
            stage
            label
            also
            actor
            done
            reason
            createdAt
            payment {
                id
                label
                amount
                status
            }
            events {
                id
                stage
                label
                note
                actor
                createdAt
            }
            actions {
                to
                label
                needsReason
            }
        }
    }
`;

// المراحل ومسمّياتها — كي يُرسم ما بقي من الطريق بأسماء الخادم لا بأسماء
// مكرّرة في الواجهة تتخلّف عنه.
export const RequestFlowStages = gql`
    query RequestFlowStages {
        requestFlowStages {
            stage
            label
            also
            actor
            done
        }
    }
`;

// قرار النادي على الطلب: قبول مبدئي، أو رفض بسببه، أو مطالبة بالرسوم،
// أو اعتماد نهائي.
export const AdvanceRequestFlow = gql`
    mutation AdvanceRequestFlow($id: ID!, $to: String!, $reason: String) {
        advanceRequestFlow(id: $id, to: $to, reason: $reason) {
            ok
            code
            message
            flow {
                id
                stage
                label
                also
                actor
                done
                reason
            }
        }
    }
`;
