import { MutationTuple, useMutation } from "@apollo/client";
import { DecidePayment } from "../../";

interface VariableProps {
    id: string;
    status: string;
    note?: string;
}

export const useDecidePayment = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DecidePayment);
};
