import { MutationTuple,useMutation } from "@apollo/client";
import { RESEND_VERIFICATION_EMAIL } from "../../";

interface VariableProps {
  email?: string;
}

const useResendEmailVerification = (): MutationTuple<any, VariableProps> => {
  return useMutation<any, VariableProps>(RESEND_VERIFICATION_EMAIL);
};

export default useResendEmailVerification;
