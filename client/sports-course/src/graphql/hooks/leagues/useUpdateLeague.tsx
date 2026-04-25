import { MutationTuple,useMutation } from "@apollo/client";
import { UpdateLeague } from "../../";


interface VariableProps {
    id?:          string;
    content: {
        name: string;
        numberTeams: string;
        numberGroups: string;
        description: string;

        startDate?: string;
        expiryDate?: string;
    }
}

export const useUpdateLeague = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateLeague);
};