import {gql} from "@apollo/client";

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
            enableAddPlayer
            createdAt
            updatedAt
            admin {
                id
                email
                person {
                    id
                    first_name
                    second_name
                    third_name
                    tribe
                }
            }
        }
    }
`;