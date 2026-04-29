import {gql} from "@apollo/client";

export const UpdateTeam = gql`
    mutation UpdateTeam($id: ID!, $content: contentTeam!) {
        updateTeam(id: $id, content: $content) {
            status
        }
    }
`;