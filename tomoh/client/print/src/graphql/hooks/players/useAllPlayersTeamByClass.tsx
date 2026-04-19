import {useLazyQuery} from "@apollo/client";
import {AllPlayersTeamByClass} from "../.."

interface Props {}

export const useAllPlayersTeamByClass = () => {
    return useLazyQuery(AllPlayersTeamByClass);
};