import {MutationTuple, useMutation} from "@apollo/client";
import {UpdatePlayer, } from "../../"


interface VariableProps {
    id?:          string;
    status?:      string;
    note?:      string;
}

export const useUpdatePlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdatePlayer);
};