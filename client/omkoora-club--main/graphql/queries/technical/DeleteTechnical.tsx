import {gql} from "@apollo/client";

export const DeleteTechnical = gql`
    mutation DeleteTechnical($id: ID!) {
        deleteTechnicalApparatus(id: $id) {
            status
        }
    }
`;