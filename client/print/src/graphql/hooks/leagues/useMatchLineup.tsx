import { useLazyQuery } from "@apollo/client";
import { MatchLineup } from "../../";

export const useMatchLineup = () => {
    return useLazyQuery(MatchLineup);
};
