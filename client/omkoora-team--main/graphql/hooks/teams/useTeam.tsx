import {useQuery} from "@apollo/client";
import {Team} from "../../"

export const useTeam = (options?: any) => {
    return useQuery(Team, options);
};