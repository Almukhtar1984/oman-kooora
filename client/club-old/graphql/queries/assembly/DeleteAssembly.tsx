import {gql} from "@apollo/client";

export const DeleteAssembly = gql`
    mutation DeleteMember($id: ID!) {
        deleteAssembly(id: $id) {
            status
        }
    }
`;