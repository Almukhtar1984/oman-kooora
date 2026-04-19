import {gql} from "@apollo/client";

export const UpdateScorerMatch = gql`
    mutation UpdateScorerMatch($content: [contentUpdateScorerMatch!]) {
        updateScorerMatch(content: $content) {
            status
        }
    }
`;