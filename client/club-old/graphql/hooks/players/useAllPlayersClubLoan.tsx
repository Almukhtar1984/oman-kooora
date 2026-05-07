import {useLazyQuery, useQuery} from "@apollo/client";
import {AllPlayersClubLoan} from "../../"

interface Props {}

export const useAllPlayersClubLoan = () => {
    return useLazyQuery(AllPlayersClubLoan);
};