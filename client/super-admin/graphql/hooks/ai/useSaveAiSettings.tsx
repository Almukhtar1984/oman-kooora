import { MutationTuple, useMutation } from "@apollo/client";
import { SAVE_AI_SETTINGS } from "../../";

interface VariableProps {
    content: {
        active_provider?: string;   // "openai" | "gemini"
        enabled?:         boolean;
        provider?:        string;   // which provider the key/model below belong to
        apiKey?:          string;   // new key (omit to keep the current one)
        model?:           string;
    };
}

export const useSaveAiSettings = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(SAVE_AI_SETTINGS);
};
