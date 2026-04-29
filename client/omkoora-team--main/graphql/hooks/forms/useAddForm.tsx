import {MutationTuple, useMutation} from "@apollo/client";
import {AddForm} from "../../"


interface VariableProps {
    content: {
        subject:       string;
        file?:       any;

        id_club?:   string;
    };
}

export const useAddForm = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddForm);
};