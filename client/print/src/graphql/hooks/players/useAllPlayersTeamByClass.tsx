import {useLazyQuery} from "@apollo/client";
import {AllPlayersTeamByClass} from "../.."

export const useAllPlayersTeamByClass = () => {
    return useLazyQuery(AllPlayersTeamByClass);
};