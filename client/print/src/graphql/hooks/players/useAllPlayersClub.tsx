import {useLazyQuery} from "@apollo/client";
import {AllPlayersClub} from "../../"

export const useAllPlayersClub = () => {
    return useLazyQuery(AllPlayersClub);
};