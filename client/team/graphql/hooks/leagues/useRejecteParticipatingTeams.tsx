import { MutationTuple, useMutation } from "@apollo/client";
import { RejecteParticipatingTeams } from "../../"; // Update the path accordingly

interface VariableProps {
    id: string;
}

export const useRejecteParticipatingTeams = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(RejecteParticipatingTeams);
};
