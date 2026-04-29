import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteComment} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteComment = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteComment);
};