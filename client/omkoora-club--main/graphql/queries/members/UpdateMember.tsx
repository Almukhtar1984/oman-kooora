import {gql} from "@apollo/client";

export const UpdateMember = gql`
    mutation UpdateMember($id: ID!, $idPerson: ID! $content: contentMember!) {
        updateMember(id: $id, idPerson: $idPerson content: $content) {
            status
        }
    }
`;