import { MutationTuple, useMutation } from "@apollo/client";
import { SubmitPaymentsReceipt } from "../../";

interface VariableProps {
    ids: string[];
    reference_number: string;
    receipt?: any;
    amount?: number;
}

export const useSubmitPaymentsReceipt = (): MutationTuple<any, VariableProps> => {
    // ما يفعله الفريق هنا ينقص عدّاد «بانتظارك»، فيُقرأ بعده لا بعد دقيقة.
    return useMutation<any, VariableProps>(SubmitPaymentsReceipt, { refetchQueries: ["TeamPendingRequests"] });
};
