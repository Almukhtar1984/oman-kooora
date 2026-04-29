import {MutationTuple, useMutation} from "@apollo/client";
import {ChangeStatusPlayer, } from "../../"


interface VariableProps {
    id?:          string;
    status?:      string;
    note?:      string;
}

export const useChangeStatusPlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ChangeStatusPlayer);
};