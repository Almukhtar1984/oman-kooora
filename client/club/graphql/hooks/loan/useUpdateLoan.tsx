import { MutationTuple, useMutation } from "@apollo/client";
import { UpdateLoan } from "../../";

interface VariableProps {
    id: string; // The ID of the loan to update
    date_start?: string; // Optional: New start date
    date_end?: string;   // Optional: New end date
}

export const useUpdateLoan = (): MutationTuple<any, VariableProps> => {
    return useMutation(UpdateLoan);
};