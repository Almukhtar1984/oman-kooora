import {MutationTuple, useMutation} from "@apollo/client";
import {ChangeStatusMembersBulk} from "../../"


interface VariableProps {
    ids:        string[];
    status:     string;
    note?:      string;
}

export const useChangeStatusMembersBulk = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ChangeStatusMembersBulk);
};
