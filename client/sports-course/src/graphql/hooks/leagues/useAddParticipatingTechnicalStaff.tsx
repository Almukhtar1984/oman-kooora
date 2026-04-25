import { MutationTuple,useMutation } from "@apollo/client";
import { AddParticipatingTechnicalStaff } from "../..";


interface VariableProps {
    content: {
        id_participating_team?: string;
        id_technical_apparatus?: string;
    }[];
}

export const useAddParticipatingTechnicalStaff = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddParticipatingTechnicalStaff);
};