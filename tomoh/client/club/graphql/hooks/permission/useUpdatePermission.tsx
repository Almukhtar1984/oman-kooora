import {MutationTuple, useMutation} from "@apollo/client";
import {UpdatePermission} from "../.."


interface VariableProps {
    id?:          string;
    content: {
        teams:      string[];
        members:      string[];
        technicals:      string[];
        players:      string[];
        transfer_players:      string[];
        loan_players:      string[];
        assembly:      string[];
        inbox:      string[];
        outbox:      string[];
        meeting:      string[];
        blogs:      string[];
        forms:      string[];
        permissions:      string[];
    }
}

export const useUpdatePermission = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdatePermission);
};