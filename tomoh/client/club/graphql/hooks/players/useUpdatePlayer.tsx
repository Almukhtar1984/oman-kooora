import {MutationTuple, useMutation} from "@apollo/client";
import {UpdatePlayer, } from "../../"


interface VariableProps {
    id?:          string;
    idPerson?:          string;
    content: {
        activity: string;
        player_center: string;
        job: string;
        nationalID?: any;
        nationalIDBack?: any;

        class?: string;
        
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

export const useUpdatePlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdatePlayer);
};