import {MutationTuple, useMutation} from "@apollo/client";
import {AddTechnical} from "../../"


interface VariableProps {
    content: {
        occupation: string;
        classification: string;
        membership_date: string;

        testimony_experience: any;
        person: {
            first_name: string;
            second_name: string;
            third_name: string;
            tribe: string;
            phone: string;
            card_number: string;
            date_birth: string;
        }
        id_team?: string;
    };
}

export const useAddTechnical = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddTechnical);
};
