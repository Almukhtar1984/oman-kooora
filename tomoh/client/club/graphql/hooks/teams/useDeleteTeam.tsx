import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteTeam} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteTeam = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteTeam);
};