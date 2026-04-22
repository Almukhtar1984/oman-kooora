import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateParticipatingTeams} from "../../"


interface VariableProps {
    content: {
        id?:   string;
        group: string;
        id_league: string;
        id_team: string;
    }[]
}

export const useUpdateParticipatingTeams = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateParticipatingTeams);
};