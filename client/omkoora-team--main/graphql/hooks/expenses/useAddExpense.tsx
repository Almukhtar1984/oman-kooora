import {MutationTuple, useMutation} from "@apollo/client";
import {AddExpense} from "../../"


interface VariableProps {
    content: {
        value:      number;
        note:       string;
        attachment?: any;
        id_club?:   string;
        id_team?:   string;
    };
}

export const useAddExpense = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddExpense);
};