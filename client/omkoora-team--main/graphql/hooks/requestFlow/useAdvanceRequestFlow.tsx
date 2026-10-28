import { MutationTuple, useMutation } from "@apollo/client";
import { AdvanceRequestFlow } from "../../";

interface VariableProps {
    id: string;
    to: string;
    reason?: string | null;
}

export const useAdvanceRequestFlow = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AdvanceRequestFlow);
};
