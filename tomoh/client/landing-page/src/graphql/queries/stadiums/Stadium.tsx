import {gql} from "@apollo/client";

export const Stadium = gql`
    query Stadium($id: ID) {
        stadium(id: $id) {
            id
            name
            about
            type
            attachments
            rent
            images

            club {
                id
                name
                logo
            }

            createdAt
            updatedAt
        }
    }
`;