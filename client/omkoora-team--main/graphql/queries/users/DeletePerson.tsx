import { gql } from "@apollo/client";

export const DeletePerson = gql`
    mutation DeletePerson($id: ID!) {
        deletePerson(id: $id) {
            status
        }
    }
`;
