import { gql } from "@apollo/client";

export const Active_User = gql`
  mutation ActiveUser($idPerson: ID!, $activation: Activation) {
    activeUser(id_person: $idPerson, activation: $activation) {
      status
    }
  }
`;