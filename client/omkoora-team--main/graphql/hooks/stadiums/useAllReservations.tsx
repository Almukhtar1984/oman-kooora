import {useLazyQuery} from "@apollo/client";
import {gql} from "@apollo/client";

export const AllReservations = gql`
    query AllReservations($idStadium: ID) {
        allReservations(idStadium: $idStadium) {
            id
            phone
            booking_date
            booking_start
            booking_end
            
            stadium {
                id
                name
                rent
            }
            status
            createdAt
            updatedAt
        }
    }
`;

interface Props {}

export const useAllReservations = () => {
    return useLazyQuery(AllReservations);
};