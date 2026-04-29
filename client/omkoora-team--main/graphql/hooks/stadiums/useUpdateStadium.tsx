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
        start_time : string;
        end_time  : string;
        mohafada :string;
        wiliya  :string;
        images?:       any;
    }
}

export const useUpdateStadium = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateStadium);
};