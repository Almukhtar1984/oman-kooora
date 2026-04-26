import { gql } from "@apollo/client";

export const DeleteClubManagement = gql`
    mutation DeleteClubManagement($id: ID!) {
        deleteClubManagement(id: $id) {
            status
        }
    }
`;