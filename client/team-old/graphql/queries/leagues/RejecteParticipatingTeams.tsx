import { gql } from "@apollo/client";

export const RejecteParticipatingTeams = gql`
    mutation RejecteParticipatingTeams($id: ID!) {
        rejecteParticipatingTeams(id: $id) {
            status
        }
    }
`;
