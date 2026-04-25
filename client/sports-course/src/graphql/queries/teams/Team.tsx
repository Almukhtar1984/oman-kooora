import { gql } from "@apollo/client";

export const Team = gql`
    query Team($id: ID!) {
        team(id: $id) {
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
        }
    }
`;