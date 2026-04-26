import {gql} from "@apollo/client";

export const UpdateParticipatingTeams = gql`
    mutation UpdateParticipatingTeams($content: [contentUpdateParticipatingTeams]!) {
        updateParticipatingTeams(content: $content) {
            status
        }
    }
`;