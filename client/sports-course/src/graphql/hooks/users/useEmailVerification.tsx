import { gql,useMutation } from "@apollo/client";

const VERIFICATION_EMAIL = gql`
    mutation emailVerification($token: String) {
        emailVerification(token: $token) {
            status
        }
    }
`;


const useEmailVerification = () => {
    return useMutation<any, { token: string }>(VERIFICATION_EMAIL);
};

export default useEmailVerification;
