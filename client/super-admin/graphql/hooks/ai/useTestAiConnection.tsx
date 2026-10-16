import { MutationTuple, useMutation } from "@apollo/client";
import { TEST_AI_CONNECTION } from "../../";

interface VariableProps {
    provider: string;   // "openai" | "gemini"
    apiKey?:  string;   // the typed key, or omit to test the stored one
}

export const useTestAiConnection = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(TEST_AI_CONNECTION);
};
