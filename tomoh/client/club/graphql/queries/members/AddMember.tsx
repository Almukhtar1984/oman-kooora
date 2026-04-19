import {gql} from "@apollo/client";

export const AddMember = gql`
    mutation CreateMember($content: contentAdminMember!) {
        createAdminMember(content: $content) {
            id
        }
    }
`;