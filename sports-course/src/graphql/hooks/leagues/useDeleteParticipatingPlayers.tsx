import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteParticipatingPlayers} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteParticipatingPlayers = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteParticipatingPlayers);
};