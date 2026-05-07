import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateAssembly} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        first_name?:         string;
        second_name?:        string;
        third_name?:         string;
        tribe?:              string;
        date_birth?:         string;
        card_number?:        string;
        phone?:              string;
        type?:               string;

        nationalID?:         any;
        nationalIDBack?:         any;
        personal_picture?:   any;
        membership_date?:    string;
        gender?:             string;
        subscription_date?:  string;
    }
}

export const useUpdateAssembly = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateAssembly);
};