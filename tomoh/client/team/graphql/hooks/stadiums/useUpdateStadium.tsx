import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateStadium} from "../../queries"


interface VariableProps {
    id?:          string;
    content: {
        name:       string;
        about:       string;
        type:       string;
        attachments:       string;
        rent:       number;
        images?:       any;
    }
}

export const useUpdateStadium = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateStadium);
};