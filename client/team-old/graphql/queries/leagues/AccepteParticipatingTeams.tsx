import { gql } from "@apollo/client";

export const AccepteParticipatingTeams = gql`
    mutation AccepteParticipatingTeams($id: ID!) {
        accepteParticipatingTeams(id: $id) {
            status
        }
    }
`;