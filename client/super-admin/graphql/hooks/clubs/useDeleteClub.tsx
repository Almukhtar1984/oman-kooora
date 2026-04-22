import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteClub} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteClub = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteClub);
};