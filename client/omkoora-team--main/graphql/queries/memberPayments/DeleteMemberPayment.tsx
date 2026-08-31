import {gql} from "@apollo/client";

export const DeleteMemberPayment = gql`
    mutation DeleteMemberPayment($id: ID!) {
        deleteMemberPayment(id: $id) {
            status
        }
    }
`;
