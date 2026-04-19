import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteAssembly} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteAssembly = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteAssembly);
};