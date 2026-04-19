import {useLazyQuery, useQuery} from "@apollo/client";
import {AllPlayersClubTransferred} from "../../"

interface Props {}

export const useAllPlayersClubTransferred = () => {
    return useLazyQuery(AllPlayersClubTransferred);
};