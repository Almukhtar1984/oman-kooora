import { useLazyQuery } from "@apollo/client";
import { TeamRoster } from "../../";

export const useTeamRoster = () => {
    return useLazyQuery(TeamRoster);
};
