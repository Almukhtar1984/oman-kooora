import { gql } from "@apollo/client";

// Import a club membership register (الجمعية العمومية) from an Excel file.
// Preserves the club's own membership number and tolerates missing fields.
export const UploadAssemblySheet = gql`
  mutation UploadAssemblySheet($idClub: ID!, $file: Upload!) {
    uploadAssemblySheet(idClub: $idClub, file: $file) {
      created
      skipped
      duplicates
      totalRows
      message
    }
  }
`;
