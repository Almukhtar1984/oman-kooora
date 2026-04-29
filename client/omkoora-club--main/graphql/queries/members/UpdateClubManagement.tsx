import {gql} from "@apollo/client";

export const UpdateClubManagement = gql`
    mutation UpdateClubManagement($id: ID!, $idPerson: ID!,$content: contentClubManagement!) {
        updateClubManagement(id: $id, idPerson: $idPerson, content: $content) {
            status
        }
    }
`;