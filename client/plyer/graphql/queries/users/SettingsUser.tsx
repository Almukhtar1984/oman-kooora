import {gql} from "@apollo/client";

export const SettingsUser = gql`
    mutation SettingsUser($id: ID!, $content: contentUser!) {
        updateUser (id: $id, content: $content) {
            status
        }
    }
`;