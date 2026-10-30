import { MutationTuple, useMutation } from "@apollo/client";
import { SubmitPaymentsReceipt } from "../../";

interface VariableProps {
    ids: string[];
    reference_number: string;
    receipt?: any;
    amount?: number;
}

export const useSubmitPaymentsReceipt = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(SubmitPaymentsReceipt);
};
