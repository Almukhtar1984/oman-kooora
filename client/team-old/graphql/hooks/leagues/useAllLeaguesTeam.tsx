import {useLazyQuery, useQuery} from "@apollo/client";
import {AllLeaguesTeam} from "../../"

interface Props {}

export const useAllLeaguesTeam = () => {
    return useLazyQuery(AllLeaguesTeam);
};