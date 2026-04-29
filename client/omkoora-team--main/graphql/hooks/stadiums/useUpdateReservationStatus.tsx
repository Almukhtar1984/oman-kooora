import { useMutation } from "@apollo/client";
import { UpdateReservationStatus } from "../../queries"; // Import your mutation

export const useUpdateReservationStatus = () => {
  return useMutation(UpdateReservationStatus);
};
