import {gql, MutationTuple, useMutation,} from "@apollo/client";

const VERIFICATION_EMAIL = gql`
    mutation emailVerification($token: String) {
        emailVerification(token: $token) {
            status
        }
    }
`;

interface VariableProps {
    token: string;
}

const useEmailVerification = () => {
    return useMutation(VERIFICATION_EMAIL);
};

export default useEmailVerification;
