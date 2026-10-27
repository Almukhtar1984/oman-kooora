import { LazyQueryResultTuple, useLazyQuery } from "@apollo/client";
import { ClubFees } from "../../";

export const useClubFees = (): LazyQueryResultTuple<any, {}> => {
    return useLazyQuery<any, {}>(ClubFees);
};
