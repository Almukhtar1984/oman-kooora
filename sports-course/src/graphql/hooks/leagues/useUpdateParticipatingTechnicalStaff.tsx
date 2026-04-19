import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateParticipatingTechnicalStaff} from "../.."


interface VariableProps {
    content: {
        id?:   string;
        id_participating_team?: string;
        id_technical_apparatus?: string;
        startDate?: string;
        expiryDate?: string;
    }[]
}

export const useUpdateParticipatingTechnicalStaff = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateParticipatingTechnicalStaff);
};