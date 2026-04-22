import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateComment} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        content:         string;
        id_message:      string;
    }
}

export const useUpdateComment = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateComment);
};