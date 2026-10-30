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

        # Recent matches the caller can turn into news (newest first). Pass
        # id_team (team app) or id_club (club app) to scope; league admin sees
        # their leagues, super admin sees all.
        aiMatchCandidates(limit: Int, id_team: ID, id_club: ID): [AiMatchCandidate!] @auth(requires: user)
    }

    extend type Mutation {
        saveAiSettings(content: aiSettingsInput!): statusUpdate @auth(requires: user)
        testAiConnection(provider: String!, apiKey: String): AiTestResult @auth(requires: user)
        # Remove the stored key for a provider ("إلغاء الربط"). If nothing stays
        # linked the feature is switched off, so no AI button points at a
        # provider that can no longer answer.
        disconnectAiProvider(provider: String!): statusUpdate @auth(requires: user)

        # Generate a news article from a finished match and save it as a Blog.
        # A team saves a draft for its club to review; owner/league/club may
        # publish (publish=true). id_team/id_club tag the news. Returns the Blog.
        generateMatchNews(id_match: ID!, publish: Boolean, id_team: ID, id_club: ID): Blog @auth(requires: user)

        # Match news as an editable draft (does NOT save): the caller fills the
        # add-news form with it, attaches images, and saves via createBlog.
        draftMatchNews(id_match: ID!): AiNewsDraft @auth(requires: user)

        # AI news editor: draft from an idea / reformulate / improve a text.
        # Returns an editable draft only (does NOT save) — the caller reviews and
        # then saves via createBlog. (super-admin or league admin)
        draftNews(content: aiNewsDraftInput!): AiNewsDraft @auth(requires: user)

        # Draft an official message to a club / team from a brief. Returns an
        # editable {subject, content} only (does NOT send). (super-admin or
        # league admin)
        draftMessage(content: aiMessageDraftInput!): AiMessageDraft @auth(requires: user)
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

    type AiMatchCandidate {
        id:         ID!
        date:       String
        stage:      String    # الدور بالعربية (النهائي، نصف النهائي…)
        league:     String
        teamA:      String
        teamB:      String
        goalsA:     Int
        goalsB:     Int
        matchState: String    # before-start | playing | end
    }

    type AiNewsDraft {
        subject:           String
        short_description: String
        description:       String
    }

    input aiNewsDraftInput {
        text:     String!    # the idea/points, or the text to reformulate/improve
        mode:     String     # draft | reformulate | improve (default: draft)
        category: String     # news | competitions | players | clubs (for tone)
    }

    type AiMessageDraft {
        subject: String
        content: String
    }

    input aiMessageDraftInput {
        brief:         String!   # the subject / points of the message
        tone:          String    # formal | friendly | firm (default: formal)
        recipientType: String    # club | team
        recipientName: String    # optional — address the recipient by name
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
