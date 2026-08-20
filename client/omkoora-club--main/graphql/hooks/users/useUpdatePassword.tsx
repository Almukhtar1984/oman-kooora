import { useMutation } from "@apollo/client";
import { UpdatePassword } from "../../queries";

const useUpdatePassword = () => {
  return useMutation(UpdatePassword);
};

export default useUpdatePassword;
