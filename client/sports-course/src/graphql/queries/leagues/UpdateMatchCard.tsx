import { gql } from "@apollo/client";

export const UpdateMatchCard = gql`
    mutation UpdateMatchCard($id: ID!, $content: contentMatchCard!) {
        updateMatchCard(id: $id, content: $content) {
            status
        }
    }
`;