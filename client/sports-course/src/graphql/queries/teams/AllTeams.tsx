import { gql } from "@apollo/client";

export const AllTeams = gql`
    query AllTeams {
        allTeams {
            id
            name
            category
            logo
            phone
            manager_name
            activities
            account_status
            code
            createdAt
            updatedAt

            club {
                id
                name
                logo
            }
        }
    }
`;