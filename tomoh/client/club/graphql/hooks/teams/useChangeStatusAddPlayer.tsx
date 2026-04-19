import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateTeam} from "../.."


interface VariableProps {
    id?:          string;
    content: {
        enableAddPlayer?: boolean;
    }
}

export const useChangeStatusAddPlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateTeam);
};