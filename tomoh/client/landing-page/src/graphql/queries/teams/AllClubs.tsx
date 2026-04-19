import {gql} from "@apollo/client";

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
                logo
                activities
                account_status
                code
                enableAddPlayer
            }

            createdAt
            updatedAt
        }
    }
`;