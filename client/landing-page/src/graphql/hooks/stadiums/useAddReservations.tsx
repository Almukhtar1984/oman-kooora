import {gql, MutationTuple, useMutation} from "@apollo/client";

const AddReservations = gql`
    mutation CreateReservations($content: contentReservations!) {
        createReservations(content: $content) {
            id
        }
    }
`;

interface VariableProps {
    content: {
        phone?:          string;
        booking_date?:   string;
        booking_start?:  string;
        booking_end?:    string;

        id_stadium?:     string;
    };
}

export const useAddReservations = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddReservations);
};