import { gql } from "@apollo/client";

export const CreateSanction = gql`
    mutation CreateSanction($content: contentSanction!) {
        createSanction(content: $content) {
            id
        }
    }
`;