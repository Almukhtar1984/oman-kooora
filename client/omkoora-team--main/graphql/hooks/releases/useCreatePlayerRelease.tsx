import { MutationTuple, useMutation } from "@apollo/client";
import { CreatePlayerRelease } from "../../";

interface VariableProps {
    content: {
        id_player: string;
        reason?: string;
        letter?: File | null;
    };
}

export const useCreatePlayerRelease = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CreatePlayerRelease);
};
