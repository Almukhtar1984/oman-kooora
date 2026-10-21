import { gql } from "@apollo/client";

// Remove the stored key for a provider ("إلغاء الربط"). The backend also clears
// the model and switches the feature off when nothing stays linked.
export const DISCONNECT_AI_PROVIDER = gql`
    mutation DisconnectAiProvider($provider: String!) {
        disconnectAiProvider(provider: $provider) {
            status
        }
    }
`;
