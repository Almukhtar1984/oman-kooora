import {MutationTuple, useMutation} from "@apollo/client";
import {DeletePlayer, DeleteTechnical} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeletePlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeletePlayer);
};