import { MutationTuple, useMutation } from "@apollo/client";
import { DeleteParticipatingPlayersMatch } from "../..";

interface VariableProps { id: string; }

export const useDeleteParticipatingPlayersMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteParticipatingPlayersMatch);
};
