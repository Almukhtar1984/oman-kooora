import { MutationTuple, useMutation } from "@apollo/client";
import { DeleteTransfer } from "../../";

interface VariableProps {
    id: string;
}

export const useDeleteTransfer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteTransfer);
};
