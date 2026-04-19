import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateTransfer, } from "../../"


interface VariableProps {
    id?:          string;
    content: {
        date_end?:        string;
        status?: string;
        id_team_from?: string;
        id_team_to?: string;
        id_player?: string;
    };
}

export const useUpdateTransfer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateTransfer);
};