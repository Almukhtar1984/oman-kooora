import {gql} from "@apollo/client";

export const AddParticipatingPlayers = gql`
    mutation CreateParticipatingPlayers($content: [contentParticipatingPlayers]!) {
        createParticipatingPlayers(content: $content) {
            id
        }
    }
`;