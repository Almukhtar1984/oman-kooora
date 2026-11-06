import { useQuery } from "@apollo/client";
import { ClubPendingIds } from "../../";

export const useClubPendingIds = (key: string, skip: boolean) =>
    useQuery<any>(ClubPendingIds, {
        variables: { key },
        skip,
        fetchPolicy: "cache-and-network",
        // A decision taken here drops the row from the next read, like the badge.
        pollInterval: skip ? 0 : 30000,
    });
