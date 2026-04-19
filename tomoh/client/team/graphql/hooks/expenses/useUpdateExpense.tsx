import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateExpense} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        value:      number;
        note:       string;
        attachment?: any;
    }
}

export const useUpdateExpense = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateExpense);
};