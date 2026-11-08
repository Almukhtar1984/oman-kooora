import {gql} from "@apollo/client";

export const AddTeam = gql`
    mutation CreateTeam($content: contentTeam!) {
        createTeam(content: $content) {
            id
            name
            logo
            phone
            manager_name
            activities
            account_status
            registration_start
            registration_end
            code
            createdAt
            updatedAt
        }
    }
`;