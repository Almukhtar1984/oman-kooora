import {gql} from "@apollo/client";

export const Form = gql`
    query Form($id: ID) {
        form(id: $id) {
            id
            subject
            file

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