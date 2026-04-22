import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateMember} from "../../"


interface VariableProps {
    id?:          string;
    idPerson?:          string;
    content: {
        occupation: string;
        classification: string;
        membership_date: string;
        person: {
            first_name: string;
            second_name: string;
            third_name: string;
            tribe: string;
            phone: string;
            card_number: string;
            date_birth: string;
        }
    }
}

export const useUpdateMember = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateMember);
};