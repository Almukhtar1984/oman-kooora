import {useLazyQuery, useQuery} from "@apollo/client";
import {AllPlayersClub} from "../../"

interface Props {}

export const useAllPlayersClub = () => {
    return useLazyQuery(AllPlayersClub);
};