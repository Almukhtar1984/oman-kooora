import { QueryResult, useQuery } from "@apollo/client";
import { ClubPendingRequests } from "../../";

export const useClubPendingRequests = (): QueryResult<any> => {
    // The badge sits on every page, so it refreshes itself rather than waiting
    // for a reload: a club that decided something elsewhere sees the count drop.
    return useQuery<any>(ClubPendingRequests, {
        fetchPolicy: "cache-and-network",
        pollInterval: 60000,
    });
};
