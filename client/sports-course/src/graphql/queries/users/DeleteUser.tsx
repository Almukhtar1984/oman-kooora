import { gql } from "@apollo/client";

export const Delete_User = gql`
  mutation DeleteUser($idPerson: ID!) {
    deleteUser(id_person: $idPerson) {
      status
    }
  }
`;