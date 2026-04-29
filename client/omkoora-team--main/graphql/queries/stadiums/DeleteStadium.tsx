import {gql} from "@apollo/client";

export const DeleteStadium = gql`
    mutation DeleteStadium($id: ID!) {
        deleteStadium(id: $id) {
            status
        }
    }
`;