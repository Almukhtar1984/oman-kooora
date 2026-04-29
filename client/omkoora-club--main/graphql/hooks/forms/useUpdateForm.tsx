import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateForm} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        subject:       string;
        file?:       any;
    }
}

export const useUpdateForm = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateForm);
};