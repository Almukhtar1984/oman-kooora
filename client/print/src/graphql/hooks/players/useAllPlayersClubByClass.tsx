import {useLazyQuery} from "@apollo/client";
import {AllPlayersClubByClass} from "../.."

export const useAllPlayersClubByClass = () => {
    return useLazyQuery(AllPlayersClubByClass);
};