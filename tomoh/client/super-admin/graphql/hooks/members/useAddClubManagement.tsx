import {MutationTuple, useMutation} from "@apollo/client";
import {AddClubManagement} from "../../"


interface VariableProps {
    content: {
        membership_date: string;
        membership_date_end: string;

        user: {
            email:          string;
            password:       string;
            role:           string;

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
        id_club?: string;
    };
}

export const useAddClubManagement = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddClubManagement);
};