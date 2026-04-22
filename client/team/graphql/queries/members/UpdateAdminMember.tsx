import {gql} from "@apollo/client";

export const UpdateAdminMember = gql`
    mutation UpdateAdminMember($id: ID!, $idPerson: ID! $content: contentAdminMember!) {
        updateAdminMember(id: $id, idPerson: $idPerson content: $content) {
            status
        }
    }
`;