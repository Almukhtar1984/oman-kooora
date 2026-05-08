import {MutationTuple, useMutation} from "@apollo/client";
import {AddPermission} from "../.."


interface VariableProps {
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
        leagues?:     string[];

        id_user?:   string;
    };
}

export const useAddPermission = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddPermission);
};