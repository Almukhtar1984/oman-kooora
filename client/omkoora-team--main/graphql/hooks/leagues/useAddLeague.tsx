import {MutationTuple, useMutation} from "@apollo/client";
import {AddLeague} from "../../"


interface VariableProps {
    content: {
        name: string;
        numberTeams: number;
        numberGroups: number;
        description: string;

        startDate?: string;
        expiryDate?: string;

        id_club?: string;
    };
}

export const useAddLeague = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddLeague);
};