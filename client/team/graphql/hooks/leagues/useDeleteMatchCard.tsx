import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteMatchCard} from "../.."


interface VariableProps {
    id?: string;
}

export const useDeleteMatchCard = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteMatchCard);
};