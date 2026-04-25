import { MutationTuple,useMutation } from "@apollo/client";
import { DeleteLeague } from "../../";


interface VariableProps {
    id?: string;
}

export const useDeleteLeague = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteLeague);
};