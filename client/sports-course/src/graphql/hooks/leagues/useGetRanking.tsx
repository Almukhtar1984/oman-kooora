import { useLazyQuery } from "@apollo/client";
import { GetRanking } from "../..";

export const useGetRanking = () => {
    return useLazyQuery(GetRanking);
};
