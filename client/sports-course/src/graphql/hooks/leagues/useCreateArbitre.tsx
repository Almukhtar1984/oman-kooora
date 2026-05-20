import { MutationTuple, useMutation } from "@apollo/client";
import { CreateArbitre } from "../..";

interface VariableProps {
    id_match: string;
    Arbitre1: string;
    Arbitre2: string;
    Arbitre3: string;
    Arbitre4: string;
}

export const useCreateArbitre = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CreateArbitre);
};
