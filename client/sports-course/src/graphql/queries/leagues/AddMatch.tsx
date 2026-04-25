import { gql } from "@apollo/client";

export const AddMatch = gql`
    mutation CreateMatch($content: contentMatch!) {
        createMatch(content: $content) {
            id
        }
    }
`;