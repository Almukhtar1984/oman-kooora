import { gql } from "@apollo/client";

// خطّ تتبّع الطلب.
//
// الفريق يقدّم طلباً ثم لا يدري أين وقف — «يعني الرجّال ما يدري اتخذ قرار ولا
// لا». هذه الاستعلامات هي الخط: المرحلة التي يقف عندها الطلب، وما مرّ به،
// ودور مَن الآن.

// قائمة طلبات الفريق — بلا أحداث: الخط يُجلب للطلب الذي يُفتح وحده.
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
            fee_waived
            side
            suggestedAmount
            payment {
                id
                label
                amount
                status
                reference_number
                receipt
                decision_note
                paid_at
            }
            actions {
                to
                label
                kind
                needsReason
                needsAmount
                needsTeam
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
            fee_waived
            side
            suggestedAmount
            payment {
                id
                label
                amount
                status
                reference_number
                receipt
                decision_note
                paid_at
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
                kind
                needsReason
                needsAmount
                needsTeam
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

// إجراء الفريق على طلبه: إعادة إرساله بعد رفض مبدئي، أو إلغاؤه.
export const AdvanceRequestFlow = gql`
    mutation AdvanceRequestFlow($id: ID!, $to: String!, $reason: String, $amount: Float) {
        advanceRequestFlow(id: $id, to: $to, reason: $reason, amount: $amount) {
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
