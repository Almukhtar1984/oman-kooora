import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteMatch} from "../.."


interface VariableProps {
    id?: string;
}

export const useDeleteMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteMatch);
};