import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateRequest} from "../../queries";


interface VariableProps {
    id?:          string;
    content: {
        status?:     string;
        note?:  string;
    };
}

export const useUpdateRequest = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateRequest);
};