import {gql} from "@apollo/client";

export const AddClubManagement = gql`
    mutation CreateClubManagement($content: contentClubManagement!) {
        createClubManagement(content: $content) {
            id
            person {
                id
                user {
                    id
                }
            }
        }
    }
`;