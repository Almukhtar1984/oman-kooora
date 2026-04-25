import { MutationTuple,useMutation } from "@apollo/client";
import { UpdateMatchCard } from "../..";


interface VariableProps {
    id:    string;

    content: {
        type:    string;
        player:  number;
        date:    number;

        id_team:    string;
    };
}

export const useUpdateMatchCard = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateMatchCard);
};