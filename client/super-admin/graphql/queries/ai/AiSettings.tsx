import { gql } from "@apollo/client";

// Current AI connection settings (super-admin only). The API keys themselves
// are never returned — only *_has_key booleans say whether one is stored.
export const AI_SETTINGS = gql`
    query AiSettings {
        aiSettings {
            active_provider
            enabled
            openai_model
            gemini_model
            openai_has_key
            gemini_has_key
        }
    }
`;
