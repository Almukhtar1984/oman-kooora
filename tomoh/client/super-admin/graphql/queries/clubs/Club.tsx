import {gql} from "@apollo/client";

export const Club = gql`
    query Club($id: ID!) {
        club(id: $id) {
            id
            name
            governorate
            logo
            phone
            account_status
            createdAt
            updatedAt
        }
    }
`;