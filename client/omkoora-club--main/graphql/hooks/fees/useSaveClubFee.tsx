import { MutationTuple, useMutation } from "@apollo/client";
import { SaveClubFee } from "../../";

interface VariableProps {
    fee_type: string;
    amount?: number;
    active?: boolean;
}

export const useSaveClubFee = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(SaveClubFee);
};
