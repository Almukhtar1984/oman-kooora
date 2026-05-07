import { gql } from "@apollo/client";

export const UpdateReservationStatus = gql`
  mutation UpdateReservationStatus($id: ID!, $status: String!) {
    updateReservationStatus(id: $id, status: $status) {
        status
    }
  }
`;
