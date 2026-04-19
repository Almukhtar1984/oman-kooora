import {useLazyQuery, useQuery} from "@apollo/client";
import {AllPlayersClubByClass} from "../.."

interface Props {}

export const useAllPlayersClubByClass = () => {
    return useLazyQuery(AllPlayersClubByClass);
};