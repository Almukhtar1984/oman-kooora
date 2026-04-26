import {gql} from "@apollo/client";

export const DeleteParticipatingPlayers = gql`
    mutation DeleteParticipatingPlayers($id: ID!) {
        deleteParticipatingPlayers(id: $id) {
            status
        }
    }
`;