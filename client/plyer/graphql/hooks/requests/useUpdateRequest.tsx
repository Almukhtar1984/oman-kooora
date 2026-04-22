import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateRequest} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        content:    string;
        type?:       string;
        status?:     string;
        id_player?:  string;
    };
}

export const useUpdateRequest = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateRequest);
};