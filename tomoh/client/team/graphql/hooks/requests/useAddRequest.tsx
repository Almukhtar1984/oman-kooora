import {MutationTuple, useMutation} from "@apollo/client";
import {AddRequest} from "../../queries";


interface VariableProps {
    content: {
        content:    string;
        type:       string;
        status:     string;
        id_player:  string;
    };
}

export const useAddRequest = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddRequest);
};