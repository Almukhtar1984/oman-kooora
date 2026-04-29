import {MutationTuple, useMutation} from "@apollo/client";
import {CreateTransfer} from "../../"


interface VariableProps {
    content: {
        status: string;
        type: string;
        id_team_from: string;
        id_team_to: string;
        id_player: string;

        transition_type?: string;
        date_end?: string;

        date_start?: string;
    };
}

export const useCreateTransfer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CreateTransfer);
};
