import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteStadium} from "../../queries"


interface VariableProps {
    id?: string;
}

export const useDeleteStadium = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteStadium);
};