import { LazyQueryResultTuple, useLazyQuery } from "@apollo/client";
import { ClubMemberAccounts } from "../../";

export const useClubMemberAccounts = (): LazyQueryResultTuple<any, { year?: number }> => {
    return useLazyQuery<any, { year?: number }>(ClubMemberAccounts);
};
