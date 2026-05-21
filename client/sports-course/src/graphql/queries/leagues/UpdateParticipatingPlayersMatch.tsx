import { gql } from "@apollo/client";

export const UpdateParticipatingPlayersMatch = gql`
    mutation UpdateParticipatingPlayersMatch($content: [contentUpdateParticipatingPlayersMatch!]!) {
        updateParticipatingPlayersMatch(content: $content) {
            status
        }
    }
`;
