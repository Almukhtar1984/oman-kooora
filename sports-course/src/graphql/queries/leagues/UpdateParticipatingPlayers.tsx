import {gql} from "@apollo/client";

export const UpdateParticipatingPlayers = gql`
    mutation UpdateParticipatingPlayers($content: [contentUpdateParticipatingPlayers]!) {
        updateParticipatingPlayers(content: $content) {
            status
        }
    }
`;