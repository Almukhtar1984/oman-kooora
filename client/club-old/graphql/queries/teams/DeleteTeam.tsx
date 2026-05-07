import {gql} from "@apollo/client";

export const DeleteTeam = gql`
    mutation DeleteTeam($id: ID!) {
        deleteTeam(id: $id) {
            status
        }
    }
`;