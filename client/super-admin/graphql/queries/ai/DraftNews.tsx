import { gql } from "@apollo/client";

// AI news editor: draft from an idea / reformulate / improve. Returns an
// editable draft only (does NOT save) — persist later via createBlog.
export const DRAFT_NEWS = gql`
    mutation DraftNews($content: aiNewsDraftInput!) {
        draftNews(content: $content) {
            subject
            short_description
            description
        }
    }
`;
