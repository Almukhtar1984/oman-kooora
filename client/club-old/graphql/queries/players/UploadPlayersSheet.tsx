import { gql } from "@apollo/client";

export const UploadPlayersSheet = gql`
  mutation UploadPlayersSheet($teamId: ID!, $file: Upload!) {
    uploadPlayersSheet(teamId: $teamId, file: $file) {
      numberOfPersonCreated
      numberOfPersonRefused
    }
  }
`;
