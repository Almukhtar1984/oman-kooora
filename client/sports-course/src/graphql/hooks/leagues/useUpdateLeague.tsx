import { MutationTuple,useMutation } from "@apollo/client";
import { UpdateLeague } from "../../";


interface VariableProps {
    id?:          string;
    content: {
        name: string;
        numberTeams: number | string;
        numberGroups: number | string;
        description: string;

        startDate?: string;
        expiryDate?: string;

        internalplayer?: number;
        externalplayer?: number;
    }
}

export const useUpdateLeague = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateLeague);
};