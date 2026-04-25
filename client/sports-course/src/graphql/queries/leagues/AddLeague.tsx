import { gql } from "@apollo/client";

export const AddLeague = gql`
    mutation CreateLeague($content: contentLeague!) {
        createLeague(content: $content) {
            id
        }
    }
`;