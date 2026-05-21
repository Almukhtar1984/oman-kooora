import { gql } from "@apollo/client";

export const UpdateParticipatingPlayerMatchSub = gql`
    mutation UpdateParticipatingPlayerMatchSub($id: ID!, $sub: Boolean!) {
        updateParticipatingPlayerMatchSub(id: $id, sub: $sub) {
            status
        }
    }
`;
