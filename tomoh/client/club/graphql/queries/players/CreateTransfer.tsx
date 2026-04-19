import {gql} from "@apollo/client";

export const CreateTransfer = gql`
    mutation CreateTransfer($content: contentTransfer!) {
        createTransfer(content: $content) {
            id
        }
    }
`;