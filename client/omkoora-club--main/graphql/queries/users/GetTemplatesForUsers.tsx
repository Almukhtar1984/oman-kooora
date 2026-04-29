import { gql } from "@apollo/client";

export const all_Formats = gql`
  query AllFormats {
    allFormats {
      id
      message
      type
      createdAt
      updatedAt
    }
  }
`;