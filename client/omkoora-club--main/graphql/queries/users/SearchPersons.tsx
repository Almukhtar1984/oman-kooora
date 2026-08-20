import { gql } from "@apollo/client";

// Search persons by name (any part) or civil id — used to add an existing
// player / staff / board member to the general assembly.
export const SearchPersons = gql`
  query SearchPersons($query: String!) {
    searchPersons(query: $query) {
      id
      personal_picture
      first_name
      second_name
      third_name
      tribe
      phone
      card_number
      date_birth
      member { occupation classification status team { id name } }
      player { activity status team { id name } }
      technicalApparatus { occupation status team { id name } }
      clubManagement { role }
    }
  }
`;
