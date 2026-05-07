import {useLazyQuery, useQuery} from "@apollo/client";
import {AllScorerMatch} from "../../"

interface Props {}

export const useAllScorerMatch = () => {
    return useLazyQuery(AllScorerMatch);
};