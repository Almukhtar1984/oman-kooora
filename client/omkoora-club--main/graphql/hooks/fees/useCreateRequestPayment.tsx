import { MutationTuple, useMutation } from "@apollo/client";
import { CreateRequestPayment } from "../../";

interface VariableProps {
    content: {
        fee_type: string;
        id_team: string;
        amount?: number;
        entity_type?: string;
        entity_id?: string;
        note?: string;
    };
}

export const useCreateRequestPayment = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CreateRequestPayment);
};
