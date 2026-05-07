
import {GetRanking} from "../.."

import {useLazyQuery, useQuery} from "@apollo/client";



interface Props {}

export const useGetRanking = () => {
    return useLazyQuery(GetRanking);
};