import { MutationTuple, useMutation } from "@apollo/client";
import { UpdateParticipatingPlayerMatchSub } from "../..";

interface VariableProps { id: string; sub: boolean; }

export const useUpdateParticipatingPlayerMatchSub = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateParticipatingPlayerMatchSub);
};
