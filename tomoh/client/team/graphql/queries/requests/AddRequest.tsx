import {gql} from "@apollo/client";

export const AddRequest = gql`
    mutation CreateRequest($content: contentRequest!) {
        createRequest(content: $content) {
            id
        }
    }
`;