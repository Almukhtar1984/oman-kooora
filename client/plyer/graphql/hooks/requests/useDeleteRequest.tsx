import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteRequest} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteRequest = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteRequest);
};