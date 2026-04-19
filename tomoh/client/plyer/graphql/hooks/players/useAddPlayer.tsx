import {MutationTuple, useMutation} from "@apollo/client";
import {AddPlayer} from "../../"


interface VariableProps {
    content: {
        activity: string;
        player_center: string;
        weight: number;
        height: number;
        job: string;

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

export const useAddPlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddPlayer);
};
