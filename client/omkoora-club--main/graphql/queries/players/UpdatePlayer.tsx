import {gql} from "@apollo/client";

export const UpdatePlayer = gql`
    mutation UpdatePlayer($id: ID!, $idPerson: ID! $content: contentPlayer!) {
        updatePlayer(id: $id, idPerson: $idPerson content: $content) {
            status
        }
    }
`;