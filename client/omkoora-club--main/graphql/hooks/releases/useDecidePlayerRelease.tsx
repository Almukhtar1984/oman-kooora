import { MutationTuple, useMutation } from "@apollo/client";
import { DecidePlayerRelease } from "../../";

interface VariableProps {
    id: string;
    status: string;
    note?: string;
}

export const useDecidePlayerRelease = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DecidePlayerRelease);
};
