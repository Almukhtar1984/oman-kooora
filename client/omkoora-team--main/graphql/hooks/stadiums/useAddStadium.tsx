import {MutationTuple, useMutation} from "@apollo/client";
import {AddStadium} from "../../queries";



interface VariableProps {
    content: {
        name:       string;
        about:       string;
        type:       string;
        attachments:       string;
        rent:       number;
        images?:       any;
        start_time : string;
        end_time  : string;
        mohafada :string;
        wiliya  :string;
        id_team?:   string;
    };
}

export const useAddStadium = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddStadium);
};