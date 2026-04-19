import {useLazyQuery} from "@apollo/client";
import {AllPlayersTeam} from "../../"

interface Props {}

export const useAllPlayersTeam = () => {
    return useLazyQuery(AllPlayersTeam);
};