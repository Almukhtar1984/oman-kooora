import {gql} from "@apollo/client";

export const AddForm = gql`
    mutation CreateForm($content: contentForm!) {
        createForm(content: $content) {
            id
        }
    }
`;