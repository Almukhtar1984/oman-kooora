import { useLazyQuery } from "@apollo/client";
import { LeagueStatsReport } from "../../";

// errorPolicy "all" → Apollo returns whatever aggregates resolved even if one
// of them errors server-side, so the report degrades gracefully (e.g. shows
// standings + scorers even if the cards aggregate hiccups) instead of blanking.
export const useLeagueStats = () => {
    return useLazyQuery(LeagueStatsReport, { errorPolicy: "all" });
};
