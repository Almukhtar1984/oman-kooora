import { gql } from "@apollo/client";

export const CreateParticipatingPlayersMatch = gql`
    mutation CreateParticipatingPlayersMatch($content: [contentParticipatingPlayerMatch]!) {
        createParticipatingPlayersMatch(content: $content) {
            id
            starter
            sub
        }
    }
`;
