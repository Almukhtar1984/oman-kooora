import {gql} from "apollo-server-express";

// AI connection — super-admin only. Keys are write-only (never returned).
export const typeDefs = gql`

    extend type Query {
        # Current connection settings (no keys — just whether each is set).
        aiSettings: AiSettings @auth(requires: user)
        # Latest available models for a provider, filtered to the popular/most-used
        # (uses the given apiKey, or the stored one if omitted). This powers the
        # "تحديث الموديلات" button.
        aiAvailableModels(provider: String!, apiKey: String): [AiModel!] @auth(requires: user)
    }

    extend type Mutation {
        saveAiSettings(content: aiSettingsInput!): statusUpdate @auth(requires: user)
        testAiConnection(provider: String!, apiKey: String): AiTestResult @auth(requires: user)
    }

    type AiSettings {
        active_provider: String       # "openai" | "gemini"
        enabled:         Boolean
        openai_model:    String
        gemini_model:    String
        openai_has_key:  Boolean       # true if a key is stored (key itself never exposed)
        gemini_has_key:  Boolean
    }

    type AiModel {
        id:          String!
        recommended: Boolean
    }

    type AiTestResult {
        ok:      Boolean!
        message: String
        models:  [AiModel!]
    }

    input aiSettingsInput {
        active_provider: String    # set the active provider
        enabled:         Boolean   # turn the feature on/off
        provider:        String    # which provider the key/model below belong to
        apiKey:          String    # new key for \`provider\` (omit to keep the current one)
        model:           String    # model for \`provider\`
    }
`;
