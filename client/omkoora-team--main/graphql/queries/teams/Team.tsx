import {gql} from "@apollo/client";

export const Team = gql`
    query Team($id: ID!) {
        team(id: $id) {
            id
            name
            logo
            phone
            manager_name
            activities
            account_status
            code
            enableAddPlayer
            club {
                id
            }
            createdAt
            updatedAt
        }
    }
`;