import { useLazyQuery } from "@apollo/client";
import { LeagueTeams } from "../../";

export const useLeagueTeams = () => {
    return useLazyQuery(LeagueTeams);
};
