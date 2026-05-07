import {gql} from "@apollo/client";

export const AddAdminMember = gql`
    mutation CreateMember($content: contentAdminMember!) {
        createAdminMember(content: $content) {
            id
            person {
                id
                user {
                    id
                }
            }
        }
    }
`;