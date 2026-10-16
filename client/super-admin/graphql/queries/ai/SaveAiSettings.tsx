import { gql } from "@apollo/client";

// Upsert the AI connection settings. `apiKey` is write-only: send it to set a
// new key for `provider`, omit it to keep the current one. The key is encrypted
// at rest on the server and never read back.
export const SAVE_AI_SETTINGS = gql`
    mutation SaveAiSettings($content: aiSettingsInput!) {
        saveAiSettings(content: $content) {
            status
        }
    }
`;
