import {useLazyQuery, useQuery} from "@apollo/client";
import {AllPlayers} from "../../"

interface Props {}

export const useAllPlayers = () => {
    return useLazyQuery(AllPlayers);
};