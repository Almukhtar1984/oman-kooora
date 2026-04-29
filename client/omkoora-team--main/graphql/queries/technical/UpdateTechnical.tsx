import {gql} from "@apollo/client";

export const UpdateTechnical = gql`
    mutation UpdateTechnical($id: ID!, $idPerson: ID! $content: contentTechnicalApparatus!) {
        updateTechnicalApparatus(id: $id, idPerson: $idPerson content: $content) {
            status
        }
    }
`;