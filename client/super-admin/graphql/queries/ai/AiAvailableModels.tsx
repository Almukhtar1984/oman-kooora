import { gql } from "@apollo/client";

// Fetch the latest available models for a provider, filtered to the popular /
// most-used and ranked newest-first. Pass apiKey to probe a key the user just
// typed (before saving); omit it to use the stored key. Powers the
// "تحديث الموديلات" button.
export const AI_AVAILABLE_MODELS = gql`
    query AiAvailableModels($provider: String!, $apiKey: String) {
        aiAvailableModels(provider: $provider, apiKey: $apiKey) {
            id
            recommended
        }
    }
`;
