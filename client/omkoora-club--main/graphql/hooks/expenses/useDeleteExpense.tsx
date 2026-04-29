import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteExpense} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteExpense = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteExpense);
};