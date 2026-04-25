import { useLazyQuery } from "@apollo/client";
import { Team } from "../../";


export const useTeam = () => {
    return useLazyQuery(Team);
};