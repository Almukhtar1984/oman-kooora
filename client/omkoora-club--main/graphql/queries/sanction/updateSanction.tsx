import { gql } from "@apollo/client";

export const UpdateSanction = gql`
    mutation UpdateSanction($id: ID!, $content: contentSanction!) {
        updateSanction(id: $id, content: $content) {
            status
        }
    }
`;