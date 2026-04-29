import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateTeam} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        account_status: boolean;
    }
}

export const useChangeStatusTeam = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateTeam);
};