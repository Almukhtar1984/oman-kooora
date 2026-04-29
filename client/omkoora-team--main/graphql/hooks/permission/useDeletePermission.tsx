import {MutationTuple, useMutation} from "@apollo/client";
import {DeletePermission} from "../.."


interface VariableProps {
    id?: string;
}

export const useDeletePermission = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeletePermission);
};