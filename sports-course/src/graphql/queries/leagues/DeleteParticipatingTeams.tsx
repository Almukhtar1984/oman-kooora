import {gql} from "@apollo/client";

export const DeleteParticipatingTeams = gql`
    mutation DeleteParticipatingTeams($id: ID!) {
        deleteParticipatingTeams(id: $id) {
            status
        }
    }
`;