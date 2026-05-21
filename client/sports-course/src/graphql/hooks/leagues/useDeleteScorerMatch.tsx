import { MutationTuple, useMutation } from "@apollo/client";
import { DeleteScorerMatch } from "../..";

interface VariableProps { id: string; }

export const useDeleteScorerMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteScorerMatch);
};
