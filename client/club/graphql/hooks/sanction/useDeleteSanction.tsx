import { MutationTuple, useMutation } from "@apollo/client";
import { DeleteSanction } from "../../";

interface VariableProps {
    id: string;
}

export const useDeleteSanction = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteSanction);
};
