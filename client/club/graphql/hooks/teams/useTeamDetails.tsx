import {useLazyQuery} from "@apollo/client";
import {TeamDetails} from "../../";

export const useTeamDetails = () => {
    return useLazyQuery(TeamDetails);
};
