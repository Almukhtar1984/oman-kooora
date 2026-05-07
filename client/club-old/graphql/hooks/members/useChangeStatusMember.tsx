import {MutationTuple, useMutation} from "@apollo/client";
import {ChangeStatusMember} from "../../"


interface VariableProps {
    id?:          string;
    status?:      string;
    note?:      string;
}

export const useChangeStatusMember = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ChangeStatusMember);
};