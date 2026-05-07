import {MutationTuple, useMutation} from "@apollo/client";
import {AddParticipatingPlayersMatchs} from "../.."


interface VariableProps {
    contentParticipatingPlayerMatch: {
        starter?: boolean;
        id_match?: string;
        id_participating_player?: string;
    }[];
}

export const useAddParticipatingPlayersMatch = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddParticipatingPlayersMatchs);
};