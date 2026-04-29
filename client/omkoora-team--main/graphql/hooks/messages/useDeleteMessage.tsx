import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteMessage} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteMessage = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteMessage);
};