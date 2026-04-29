import {gql} from "@apollo/client";

export const CreateMember = gql`
    mutation CreateMember($content: contentMember!) {
        createMember(content: $content) {
            id
        }
    }
`;
