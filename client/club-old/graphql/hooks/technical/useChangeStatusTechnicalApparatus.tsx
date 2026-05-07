import {MutationTuple, useMutation} from "@apollo/client";
import {ChangeStatusTechnicalApparatus} from "../../"


interface VariableProps {
    id?:          string;
    status?:      string;
    note?:      string;
}

export const useChangeStatusTechnicalApparatus = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ChangeStatusTechnicalApparatus);
};