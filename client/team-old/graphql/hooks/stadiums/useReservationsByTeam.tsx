import {useLazyQuery} from "@apollo/client";
import {reservationsByTeam} from "../../queries"

interface Props {}

export const useReservationsByTeam = () => {
    return useLazyQuery(reservationsByTeam);
};