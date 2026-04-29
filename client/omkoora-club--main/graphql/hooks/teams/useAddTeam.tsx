import {MutationTuple, useMutation} from "@apollo/client";
import {AddTeam} from "../../"


interface VariableProps {
    content: {
        name:           string;
        category?:       number;

        logo?:           any
        phone:          string;

        manager_name:   string;
        activities:     string;
        code:           string;
        id_club:        string;
    };
}

export const useAddTeam = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddTeam);
};
