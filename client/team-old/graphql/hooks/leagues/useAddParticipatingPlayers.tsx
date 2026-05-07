import {MutationTuple, useMutation} from "@apollo/client";
import {AddParticipatingPlayers} from "../../"


interface VariableProps {
    content: {
        id_participating_team?: string;
        id_player?: string;
        number?: string;
    }[];
}

export const useAddParticipatingPlayers = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddParticipatingPlayers);
};