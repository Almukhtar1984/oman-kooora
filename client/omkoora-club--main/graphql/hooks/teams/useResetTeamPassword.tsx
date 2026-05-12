import {MutationTuple, useMutation} from "@apollo/client";
import {ResetTeamPassword} from "../../";

interface VariableProps {
    idTeam: string;
}

interface ResultProps {
    resetTeamPassword: {
        email: string;
        password: string;
    };
}

export const useResetTeamPassword = (): MutationTuple<ResultProps, VariableProps> => {
    return useMutation<ResultProps, VariableProps>(ResetTeamPassword);
};
