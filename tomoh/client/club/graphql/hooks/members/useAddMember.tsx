import {MutationTuple, useMutation} from "@apollo/client";
import {AddMember} from "../../"


interface VariableProps {
    content: {
        occupation: string;
        classification: string;
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
        id_team?: string;
    };
}

export const useAddMember = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddMember);
};