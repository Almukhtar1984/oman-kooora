import { gql } from "@apollo/client";

// Draft an official message from a brief. Returns editable {subject, content};
// does NOT send — the author reviews then sends as usual.
export const DraftMessage = gql`
    mutation DraftMessage($content: aiMessageDraftInput!) {
        draftMessage(content: $content) {
            subject
            content
        }
    }
`;
