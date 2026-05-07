import { MutationTuple, useMutation } from "@apollo/client";
import { UpdateSanction } from "../../";

interface VariableProps {
    id: string;
    content: {
        note?: string;
        
        date_from?: string;
        date_to?: string;
    };
}

export const useUpdateSanction = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateSanction);
};
