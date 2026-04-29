import {gql} from "@apollo/client";

export const DeletePlayer = gql`
    mutation DeletePlayer($id: ID!) {
        deletePlayer(id: $id) {
            status
        }
    }
`;