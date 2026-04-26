import {gql} from "@apollo/client";

export const DeleteLeague = gql`
    mutation DeleteLeague($id: ID!) {
        deleteLeague(id: $id) {
            status
        }
    }
`;