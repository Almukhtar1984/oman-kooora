import {gql} from "@apollo/client";

export const CreateTeamWithAdmin = gql`
    mutation CreateTeamWithAdmin($team: contentTeam!, $manager: contentTeamManager!) {
        createTeamWithAdmin(team: $team, manager: $manager) {
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
