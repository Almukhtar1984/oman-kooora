import {MutationTuple, useMutation} from "@apollo/client";
import {AddComment} from "../../"


interface VariableProps {
    content: {
        content:         string;
        note?:           string;
        id_message:      string;
        id_team:         string;
    };
}

export const useAddComment = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddComment);
};