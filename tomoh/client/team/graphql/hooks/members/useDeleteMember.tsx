import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteMember, DeleteTechnical} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteMember = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteMember);
};