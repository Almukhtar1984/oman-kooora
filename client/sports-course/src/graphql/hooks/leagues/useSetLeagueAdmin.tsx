import { MutationTuple, useMutation } from "@apollo/client";
import { SetLeagueAdmin } from "../../";

interface VariableProps {
    idLeague: string;
    email: string;
    password?: string;
}

export const useSetLeagueAdmin = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(SetLeagueAdmin);
};
