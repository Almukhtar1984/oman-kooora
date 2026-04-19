import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateAdminMember} from "../../"


interface VariableProps {
    id?:          string;
    idPerson?:          string;

    content: {
        occupation: string;
        classification: string;
        membership_date: string;
        membership_date_end: string;

        user: {
            email:          string;
            password:       string;

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
    };
}

export const useAdminUpdateMember = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateAdminMember);
};