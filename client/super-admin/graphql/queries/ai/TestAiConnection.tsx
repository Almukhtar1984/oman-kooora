import { gql } from "@apollo/client";

// Probe a provider key (the one typed, or the stored one if apiKey omitted).
// Returns ok + a human message + the models the key can see.
export const TEST_AI_CONNECTION = gql`
    mutation TestAiConnection($provider: String!, $apiKey: String) {
        testAiConnection(provider: $provider, apiKey: $apiKey) {
            ok
            message
            models {
                id
                recommended
            }
        }
    }
`;
