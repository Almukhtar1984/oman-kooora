import {gql} from "@apollo/client";

export const UpdateAssembly = gql`
    mutation UpdateMember($id: ID!, $content: contentAssembly!) {
        updateAssembly(id: $id, content: $content) {
            status
        }
    }
`;