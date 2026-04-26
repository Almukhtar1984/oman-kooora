import {gql} from "@apollo/client";

export const League = gql`
    query League($id: ID!) {
        league(id: $id) {
            id
            name
            numberTeams
            numberGroups
            description

            startDate
            expiryDate
            
            createdAt
            updatedAt
        }
    }
`;