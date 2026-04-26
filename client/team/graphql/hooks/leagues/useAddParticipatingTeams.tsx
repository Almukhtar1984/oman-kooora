import {MutationTuple, useMutation} from "@apollo/client";
import {AddParticipatingTeams} from "../../"


interface VariableProps {
    content: {
        group: string;
        id_league: string;
        id_team: string;
    }[];
}

export const useAddParticipatingTeams = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddParticipatingTeams);
};