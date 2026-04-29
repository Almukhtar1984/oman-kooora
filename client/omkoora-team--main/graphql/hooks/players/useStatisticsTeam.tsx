import {useLazyQuery, useQuery} from "@apollo/client";
import {StatisticsTeam} from "../../"

interface Props {}

export const useStatisticsTeam = () => {
    return useLazyQuery(StatisticsTeam);
};