import {MutationTuple, useMutation} from "@apollo/client";
import {AddPlayer} from "../../"


interface VariableProps {
    content: {
        activity: string;
        player_center: string;
        job: string;
        nationalID?: any;
        nationalIDBack?: any;
        parentApproval?: any;
        type?: string;
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
        id_team?: string;
    };
}

export const useAddPlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddPlayer);
};
