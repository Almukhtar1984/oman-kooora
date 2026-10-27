import { MutationTuple, useMutation } from "@apollo/client";
import { SubmitPaymentReceipt } from "../../";

interface VariableProps {
    id: string;
    reference_number: string;
    receipt?: any;
    amount?: number;
}

export const useSubmitPaymentReceipt = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(SubmitPaymentReceipt);
};
