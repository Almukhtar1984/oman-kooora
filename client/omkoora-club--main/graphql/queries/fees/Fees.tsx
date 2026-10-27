import { gql } from "@apollo/client";

// قائمة أسعار النادي — كل الأنواع تُعاد، المسعّرة وغير المسعّرة.
export const ClubFees = gql`
    query ClubFees {
        clubFees {
            id
            fee_type
            label
            amount
            active
        }
    }
`;

// النادي يسعّر خدمة أو يوقفها.
export const SaveClubFee = gql`
    mutation SaveClubFee($fee_type: String!, $amount: Float, $active: Boolean) {
        saveClubFee(fee_type: $fee_type, amount: $amount, active: $active) {
            id
            fee_type
            label
            amount
            active
        }
    }
`;

// المدفوعات: النادي يرى مدفوعات ناديه، والفريق يرى مدفوعاته هو.
export const RequestPayments = gql`
    query RequestPayments($status: String, $idTeam: ID) {
        requestPayments(status: $status, idTeam: $idTeam) {
            id
            fee_type
            label
            amount
            status
            reference_number
            receipt
            note
            decision_note
            entity_type
            paid_at
            decided_at
            createdAt
            team { id name }
        }
    }
`;

// النادي يطالب فريقاً برسوم طلب بعينه.
export const CreateRequestPayment = gql`
    mutation CreateRequestPayment($content: contentRequestPayment!) {
        createRequestPayment(content: $content) {
            id
            status
            amount
            label
        }
    }
`;

// النادي يعتمد الإيصال أو يرفضه مع السبب.
export const DecidePayment = gql`
    mutation DecidePayment($id: ID!, $status: String!, $note: String) {
        decidePayment(id: $id, status: $status, note: $note) {
            status
        }
    }
`;
