import { MutationTuple, useMutation } from "@apollo/client";
import { BackToOldTeamTransfer } from "../../";

interface VariableProps {
    id: string;
}

export const useBackToOldTeamTransfer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(BackToOldTeamTransfer);
};
