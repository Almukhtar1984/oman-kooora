import { MutationTuple, useMutation } from "@apollo/client";
import { DeleteClubManagement } from "../../";

interface VariableProps {
    id?: string;
}

export const useDeleteClubManagement = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteClubManagement);
};
