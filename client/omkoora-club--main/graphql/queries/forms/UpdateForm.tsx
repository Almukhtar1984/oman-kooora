import {gql} from "@apollo/client";

export const UpdateForm = gql`
    mutation UpdateForm($id: ID!, $content: contentForm!) {
        updateForm(id: $id, content: $content) {
            status
        }
    }
`;