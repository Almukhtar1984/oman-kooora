import {gql} from "@apollo/client";

export const AddClub = gql`
    mutation CreateClub($content: contentClub!) {
        createClub(content: $content) {
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