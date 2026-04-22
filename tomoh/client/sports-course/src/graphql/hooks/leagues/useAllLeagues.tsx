import {useLazyQuery, useQuery} from "@apollo/client";
import {AllLeagues} from "../../"

interface Props {}

export const useAllLeagues = () => {
    return useLazyQuery(AllLeagues);
};