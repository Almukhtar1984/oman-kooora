import {MutationTuple, useMutation} from "@apollo/client";
import {AddAssembly} from "../../"


interface VariableProps {
    content: {
        personal_picture?:   any;
        oldPersonalPicture?: string | null;

        first_name:         string;
        second_name:        string;
        third_name:         string;
        tribe:              string;
        date_birth:         string;
        card_number:        string;
        phone:              string;
        type:               string;

        nationalID?:         any;
        nationalIDBack?:         any;
        oldNationalID?:      string | null;
        oldNationalIDBack?:      string | null;

        membership_date:    string;
        gender:             string;
        subscription_date:  string;

        id_club:            string;
        id_team?:            string;
    };
}

export const useAddAssembly = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddAssembly);
};
