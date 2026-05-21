import { MutationTuple, useMutation } from "@apollo/client";
import { UpdateParticipatingPlayersMatch } from "../..";

interface VariableProps {
    content: { id: string; id_match?: string; id_participating_player?: string; starter?: boolean }[];
}

export const useUpdateParticipatingPlayersMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateParticipatingPlayersMatch);
};
