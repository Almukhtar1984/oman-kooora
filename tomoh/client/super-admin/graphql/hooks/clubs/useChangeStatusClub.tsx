import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateClub} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        account_status: boolean;
    }
}

export const useChangeStatusClub = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateClub);
};