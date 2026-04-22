import {gql} from "@apollo/client";

export const AddAssembly = gql`
    mutation CreateAssembly($content: contentAssembly!) {
        createAssembly(content: $content) {
            id
        }
    }
`;