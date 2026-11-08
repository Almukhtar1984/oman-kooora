import {MutationTuple, useMutation} from "@apollo/client";
import {RegisterMember} from "../../"

interface VariableProps {
    content: {
        first_name:       string;
        second_name:      string;
        third_name?:      string;
        tribe:            string;
        date_birth:       string;
        card_number:      string;
        phone:            string;
        gender?:          string | null;
        type?:            string | null;
        personal_picture?: any;
        nationalID?:      any;
        nationalIDBack?:  any;
    };
}

export const useRegisterMember = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(RegisterMember);
};
