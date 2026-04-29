import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteTechnical} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteTechnical = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteTechnical);
};