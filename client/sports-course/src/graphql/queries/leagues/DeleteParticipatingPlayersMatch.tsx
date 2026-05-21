import { gql } from "@apollo/client";

export const DeleteParticipatingPlayersMatch = gql`
    mutation DeleteParticipatingPlayersMatch($id: ID!) {
        deleteParticipatingPlayersMatch(id: $id) {
            status
        }
    }
`;
