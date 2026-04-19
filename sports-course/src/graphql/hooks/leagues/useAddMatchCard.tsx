import {MutationTuple, useMutation} from "@apollo/client";
import {AddMatchCard} from "../.."


interface VariableProps {
    content: {
        type:    string;
        player:  string;
        date:    string;

        id_match:    string;
        id_team:    string;
    };
}

export const useAddMatchCard = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddMatchCard);
};