import { gql } from "@apollo/client";

export const AddParticipatingTeams = gql`
    mutation CreateParticipatingTeams($content: [contentParticipatingTeams]!) {
        createParticipatingTeams(content: $content) {
            id
        }
    }
`;