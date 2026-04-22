import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateParticipatingPlayers} from "../../"


interface VariableProps {
    content: {
        id?:   string;
        id_participating_team?: string;
        id_player?: string;
        number?: string;
    }[]
}

export const useUpdateParticipatingPlayers = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateParticipatingPlayers);
};