import { MutationTuple, useMutation } from "@apollo/client";
import { ClearLeagueAdmin } from "../../";

interface VariableProps {
    idLeague: string;
}

export const useClearLeagueAdmin = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ClearLeagueAdmin);
};
