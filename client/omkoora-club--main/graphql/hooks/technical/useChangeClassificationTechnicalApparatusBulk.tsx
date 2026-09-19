import {MutationTuple, useMutation} from "@apollo/client";
import {ChangeClassificationTechnicalApparatusBulk} from "../../"


interface VariableProps {
    ids:            string[];
    classification: string;
}

export const useChangeClassificationTechnicalApparatusBulk = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ChangeClassificationTechnicalApparatusBulk);
};
