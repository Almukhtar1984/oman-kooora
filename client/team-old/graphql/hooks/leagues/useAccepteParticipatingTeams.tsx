import { MutationTuple, useMutation } from "@apollo/client";
import { AccepteParticipatingTeams } from "../../" // Update the path accordingly

interface VariableProps {
    id: string;
}

export const useAccepteParticipatingTeams = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AccepteParticipatingTeams);
};