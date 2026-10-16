import { gql } from "@apollo/client";

// Generate a news article from a match and save it as a Blog.
// publish=true posts it live; otherwise it is saved as a draft (waiting).
export const GENERATE_MATCH_NEWS = gql`
    mutation GenerateMatchNews($id_match: ID!, $publish: Boolean) {
        generateMatchNews(id_match: $id_match, publish: $publish) {
            id
            subject
            short_description
            description
            status
        }
    }
`;
