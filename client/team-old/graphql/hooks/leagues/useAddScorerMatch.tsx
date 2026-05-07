import {MutationTuple, useMutation} from "@apollo/client";
import {AddScorerMatch} from "../.."


interface VariableProps {
    content: {
        time:    string;
        id_match:    string;
        id_participating_team:    string;
        id_participating_player:    string;
    };
}

export const useAddScorerMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddScorerMatch);
};