import { gql } from "@apollo/client";

// AI news assist: draft / reformulate / improve. Returns an editable draft only
// (does NOT save) — the author reviews then submits as usual.
export const DraftNews = gql`
    mutation DraftNews($content: aiNewsDraftInput!) {
        draftNews(content: $content) {
            subject
            short_description
            description
        }
    }
`;
