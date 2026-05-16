import {MutationTuple, useMutation} from "@apollo/client";
import {ChangeStatusTechnicalApparatusBulk} from "../../"


interface VariableProps {
    ids:        string[];
    status:     string;
    note?:      string;
}

export const useChangeStatusTechnicalApparatusBulk = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ChangeStatusTechnicalApparatusBulk);
};
