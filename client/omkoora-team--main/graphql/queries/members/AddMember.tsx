import {gql} from "@apollo/client";

export const AddMember = gql`
    mutation CreateMember($content: contentMember!) {
        createMember(content: $content) {
            id
        }
    }
`;