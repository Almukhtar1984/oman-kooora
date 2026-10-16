import { gql } from "@apollo/client";

// Save a news article. status "waiting" = draft, "accepted" = live in the feed.
export const CREATE_BLOG = gql`
    mutation CreateBlog($content: contentBlog!) {
        createBlog(content: $content) {
            id
            subject
            status
        }
    }
`;
