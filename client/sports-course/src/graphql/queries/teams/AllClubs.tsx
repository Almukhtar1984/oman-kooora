import { gql } from "@apollo/client";

export const AllClubs = gql`
    query AllClub {
        allClub {
            id
            name
            governorate
            logo
            phone
            account_status

            teams {
                id
                name
                category
                logo
                activities
                account_status
                code
            }

            createdAt
            updatedAt
        }
    }
`;