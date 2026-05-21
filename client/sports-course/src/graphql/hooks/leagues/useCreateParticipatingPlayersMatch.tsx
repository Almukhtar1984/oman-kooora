import { MutationTuple, useMutation } from "@apollo/client";
import { CreateParticipatingPlayersMatch } from "../..";

interface VariableProps {
    content: { id_match: string; id_participating_player: string; starter?: boolean }[];
}

export const useCreateParticipatingPlayersMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CreateParticipatingPlayersMatch);
};
