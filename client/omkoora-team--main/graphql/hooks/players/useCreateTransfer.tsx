import {MutationTuple, useMutation} from "@apollo/client";
import {CreateTransfer} from "../../"


interface VariableProps {
    content: {
        status: string;
        type: string;
        id_team_from: string;
        id_team_to: string;
        // A transfer moves either a player or a technical-staff member.
        id_player?: string;
        id_technical_apparatus?: string;

        transition_type?: string;
        date_end?: string;

        date_start?: string;
    };
}

export const useCreateTransfer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CreateTransfer);
};
