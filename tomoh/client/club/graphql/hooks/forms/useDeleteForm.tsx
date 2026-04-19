import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteForm} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteForm = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteForm);
};