import { gql } from "@apollo/client";

export const AddMatchCard = gql`
    mutation CreateMatchCard($content: contentMatchCard!) {
        createMatchCard(content: $content) {
            id
        }
    }
`;