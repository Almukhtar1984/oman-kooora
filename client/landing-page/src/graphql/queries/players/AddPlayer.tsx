import {gql} from "@apollo/client";

export const AddPlayer = gql`
    mutation CreatePlayer($content: contentPlayer!) {
        createPlayer(content: $content) {
            id
        }
    }
`;