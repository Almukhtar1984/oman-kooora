import { MutationTuple, useMutation } from "@apollo/client";
import { SubmitPaymentReceipt } from "../../";

interface VariableProps {
    id: string;
    reference_number: string;
    receipt?: any;
    amount?: number;
}

export const useSubmitPaymentReceipt = (): MutationTuple<any, VariableProps> => {
    // ما يفعله الفريق هنا ينقص عدّاد «بانتظارك»، فيُقرأ بعده لا بعد دقيقة.
    return useMutation<any, VariableProps>(SubmitPaymentReceipt, { refetchQueries: ["TeamPendingRequests"] });
};
