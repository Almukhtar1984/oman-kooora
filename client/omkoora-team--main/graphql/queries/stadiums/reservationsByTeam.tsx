import {gql} from "@apollo/client";

export const reservationsByTeam  = gql`
    query reservationsByTeam($idTeam: ID!) {
        reservationsByTeam(idTeam: $idTeam) {
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