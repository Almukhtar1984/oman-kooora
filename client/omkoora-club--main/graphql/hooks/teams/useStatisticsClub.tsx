import {useLazyQuery, useQuery} from "@apollo/client";
import {StatisticsClub} from "../.."

interface Props {}

export const useStatisticsClub = () => {
    return useLazyQuery(StatisticsClub);
};