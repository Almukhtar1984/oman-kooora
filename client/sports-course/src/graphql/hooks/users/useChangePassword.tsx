import { MutationTuple,useMutation } from "@apollo/client";
import { CHANGE_PW } from "../../";


interface VariableProps {
  content: {
    token?: string;
    password?: string;
    confirmPassword?: string;
  };
}

const useChangePassword = (): MutationTuple<any, VariableProps> => {
  return useMutation<any, VariableProps>(CHANGE_PW);
};

export default useChangePassword;
