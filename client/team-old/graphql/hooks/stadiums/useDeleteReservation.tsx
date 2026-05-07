import { useMutation } from "@apollo/client";
import { DeleteReservation } from "../../queries"; // Import your mutation

export const useDeleteReservation = () => {
  return useMutation(DeleteReservation);
};
