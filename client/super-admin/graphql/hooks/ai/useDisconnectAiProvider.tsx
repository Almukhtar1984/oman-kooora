import { MutationTuple, useMutation } from "@apollo/client";
import { DISCONNECT_AI_PROVIDER } from "../../";

interface VariableProps {
    provider: string;   // "openai" | "gemini"
}

export const useDisconnectAiProvider = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DISCONNECT_AI_PROVIDER);
};
