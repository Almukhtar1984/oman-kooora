import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateTeam} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        name:           string;
        category?:       number;
        logo?:          any
        phone:          string;

        manager_name:   string;
        activities:     string;
        code:           string;
    }
}

export const useUpdateTeam = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateTeam);
};