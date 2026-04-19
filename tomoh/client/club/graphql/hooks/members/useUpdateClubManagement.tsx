import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateClubManagement} from "../../"


interface VariableProps {
    id?: string;
    idPerson?: string;
    content: {
        membership_date: string;
        membership_date_end: string;
        role?: string;

        user: {
            email:          string;
            password:       string;
            role?:           string;

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

export const useUpdateClubManagement = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateClubManagement);
};