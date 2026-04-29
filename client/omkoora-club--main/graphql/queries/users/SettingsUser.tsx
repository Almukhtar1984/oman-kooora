import {gql} from "@apollo/client";

export const SettingsUser = gql`
    mutation SettingsUser($id: ID!, $content: contentSettingsUser!) {
        settingsUser(id: $id, content: $content) {
            status
        }
    }
`;