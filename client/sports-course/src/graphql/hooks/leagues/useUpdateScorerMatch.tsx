import { MutationTuple,useMutation } from "@apollo/client";
import { UpdateScorerMatch } from "../..";


interface VariableProps {
    content: {
        id?:    string;
        time:    string;
        id_match?:    string;
        id_participating_team?:    string;
        id_participating_player:    string;
    };
}

export const useUpdateScorerMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateScorerMatch);
};