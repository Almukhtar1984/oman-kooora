import { MutationTuple, useMutation } from "@apollo/client";
import { UpdateMatchState } from "../..";

interface VariableProps {
    id: string;
    state: string;
}

export const useUpdateMatchState = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateMatchState);
};
