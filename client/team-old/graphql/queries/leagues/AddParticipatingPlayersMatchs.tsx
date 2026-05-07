import { gql } from "@apollo/client";

export const AddParticipatingPlayersMatchs = gql`
    mutation createParticipatingPlayersMatch(
        $contentParticipatingPlayerMatch: [contentParticipatingPlayerMatch!]!) {

    createParticipatingPlayersMatch(content: $contentParticipatingPlayerMatch) {
         id
         }
         }
`;
