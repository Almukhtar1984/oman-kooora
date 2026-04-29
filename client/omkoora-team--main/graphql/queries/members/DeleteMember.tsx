import {gql} from "@apollo/client";

export const DeleteMember = gql`
    mutation DeleteMember($id: ID!) {
        deleteMember(id: $id) {
            status
        }
    }
`;