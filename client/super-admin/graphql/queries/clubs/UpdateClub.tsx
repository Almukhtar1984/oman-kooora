import {gql} from "@apollo/client";

export const UpdateClub = gql`
    mutation UpdateClub($id: ID!, $content: contentClub!) {
        updateClub(id: $id, content: $content) {
            status
        }
    }
`;