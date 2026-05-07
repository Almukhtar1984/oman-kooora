import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateMatch} from "../.."


interface VariableProps {
    id:    string;

    content: {
        date?:           string;
        firstTeamGoal?:  number;
        secondTeamGoal?: number;
        first_team?:     string;
        second_team?:    string;


        manOfMatch?:      string;

        type?:           string;
    };
}

export const useUpdateMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateMatch);
};