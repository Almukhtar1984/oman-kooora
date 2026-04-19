import {MutationTuple, useMutation} from "@apollo/client";
import {AddMatch} from "../.."


interface VariableProps {
    content: {
        date:           string;
        firstTeamGoal:  number;
        secondTeamGoal: number;
        first_team:     string;
        second_team:    string;

        type:           string;

        id_league:    string;
    };
}

export const useAddMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddMatch);
};