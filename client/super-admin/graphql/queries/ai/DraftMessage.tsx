import { gql } from "@apollo/client";

// Draft an official message to a club/team from a brief. Returns an editable
// {subject, content} only (does NOT send) — send later via createMessage.
export const DRAFT_MESSAGE = gql`
    mutation DraftMessage($content: aiMessageDraftInput!) {
        draftMessage(content: $content) {
            subject
            content
        }
    }
`;
