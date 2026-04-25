import {useLazyQuery} from "@apollo/client";
import {AllPlayersTeam} from "../../"

export const useAllPlayersTeam = () => {
    return useLazyQuery(AllPlayersTeam);
};