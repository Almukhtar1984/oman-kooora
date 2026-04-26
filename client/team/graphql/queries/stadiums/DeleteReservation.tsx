import { gql } from "@apollo/client";

export const DeleteReservation = gql`
  mutation DeleteReservation($id: ID!) {
    deleteReservation(id: $id) {
     status
    }
  }
`;
