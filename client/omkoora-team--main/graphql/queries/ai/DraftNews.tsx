import { gql } from "@apollo/client";

// AI news assist: draft from an idea / reformulate / improve. Returns an
// editable draft only (does NOT save) — the team then submits it as usual,
// which saves it as a draft (waiting) for the club to review.
export const DraftNews = gql`
    mutation DraftNews($content: aiNewsDraftInput!) {
        draftNews(content: $content) {
            subject
            short_description
            description
        }
    }
`;
