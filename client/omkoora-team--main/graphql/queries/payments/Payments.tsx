import { gql } from "@apollo/client";

// مدفوعات الفريق: ما يطالب به النادي، وما دفعه الفريق فعلاً.
export const RequestPayments = gql`
    query RequestPayments($status: String) {
        requestPayments(status: $status) {
            id
            fee_type
            label
            subject
            amount
            status
            reference_number
            receipt
            note
            decision_note
            paid_at
            decided_at
            createdAt
            club { id name }
        }
    }
`;

// الفريق يرفع صورة الإيصال مع الرقم المرجعي للتحويل.
export const SubmitPaymentReceipt = gql`
    mutation SubmitPaymentReceipt($id: ID!, $reference_number: String!, $receipt: Upload, $amount: Float) {
        submitPaymentReceipt(id: $id, reference_number: $reference_number, receipt: $receipt, amount: $amount) {
            status
        }
    }
`;

// إيصالٌ واحد لعدّة مطالبات — موسم المسابقات: ثلاث إعارات وانتقال بتحويلٍ واحد.
// كل مطالبة تحمل الإيصال ورقمه، فيعرف النادي ما سدّده كل جزء.
export const SubmitPaymentsReceipt = gql`
    mutation SubmitPaymentsReceipt($ids: [ID!]!, $reference_number: String!, $receipt: Upload, $amount: Float) {
        submitPaymentsReceipt(ids: $ids, reference_number: $reference_number, receipt: $receipt, amount: $amount) {
            status
            message
        }
    }
`;
