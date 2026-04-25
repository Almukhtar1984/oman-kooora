import { MutationTuple,useMutation } from "@apollo/client";
import { DeleteParticipatingTechnicalStaff } from "../..";


interface VariableProps {
    id?: string;
}

export const useDeleteParticipatingTechnicalStaff = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteParticipatingTechnicalStaff);
};