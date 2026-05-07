import { gql } from "@apollo/client";

export const BackToOldTeamTransfer = gql`
    mutation BackToOldTeamTransfer($id: ID!) {
        BackToOldTeamTransfer(id: $id) {
            status
        }
    }
`;
