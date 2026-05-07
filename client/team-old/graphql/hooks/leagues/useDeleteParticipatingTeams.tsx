import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteParticipatingTeams} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteParticipatingTeams = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteParticipatingTeams);
};