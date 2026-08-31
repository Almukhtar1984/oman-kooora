import {gql} from "@apollo/client";

export const CreateMemberPayment = gql`
    mutation CreateMemberPayment($content: contentMemberPayment!) {
        createMemberPayment(content: $content) {
            id
            amount
            note
            payment_date
        }
    }
`;
