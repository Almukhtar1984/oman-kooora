import {gql} from "@apollo/client";

export const UpdateLeague = gql`
    mutation UpdateLeague($id: ID!, $content: contentLeague!) {
        updateLeague(id: $id, content: $content) {
            status
        }
    }
`;