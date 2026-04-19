import {gql} from "@apollo/client";

export const DeleteClub = gql`
    mutation DeleteClub($id: ID!) {
        deleteClub(id: $id) {
            status
        }
    }
`;