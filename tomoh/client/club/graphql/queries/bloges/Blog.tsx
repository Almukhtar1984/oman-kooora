import {gql} from "@apollo/client";

export const Blog = gql`
    query Blog($id: ID) {
        blog(id: $id) {
            id
            subject
            short_description
            description

            createdAt
            updatedAt
        }
    }
`;