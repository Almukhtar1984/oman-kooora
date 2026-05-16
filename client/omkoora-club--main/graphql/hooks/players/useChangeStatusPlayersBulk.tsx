import {MutationTuple, useMutation} from "@apollo/client";
import {ChangeStatusPlayersBulk} from "../../"


interface VariableProps {
    ids:        string[];
    status:     string;
    note?:      string;
}

export const useChangeStatusPlayersBulk = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ChangeStatusPlayersBulk);
};
