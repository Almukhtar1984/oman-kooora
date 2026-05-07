import { MutationTuple, useMutation } from "@apollo/client";
import { ConvertPlayerToTechnical } from "../../"

interface VariableProps {
    idPlayer: string;
    classification: string;
    membership_date: string;
    membership_date_end: string;
}

export const useConvertPlayerToTechnical = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ConvertPlayerToTechnical);
};
