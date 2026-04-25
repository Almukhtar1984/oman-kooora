import { gql } from "@apollo/client";

export const AddScorerMatch = gql`
    mutation CreateScorerMatch($content: contentScorerMatch!) {
        createScorerMatch(content: $content) {
            id
        }
    }
`;