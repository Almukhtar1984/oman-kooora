import { QueryResult, useQuery } from "@apollo/client";
import { TeamPendingRequests } from "../../queries";

export const useTeamPendingRequests = (): QueryResult<any> => {
    // العدّاد على كل صفحة، فيتجدّد بنفسه: فريقٌ سدّد من صفحة أخرى يرى الرقم ينزل.
    return useQuery<any>(TeamPendingRequests, {
        fetchPolicy: "cache-and-network",
        pollInterval: 60000,
    });
};
