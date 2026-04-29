import {useLazyQuery} from "@apollo/client";
import {AllActionLogsClub} from "../.."

interface Props {}

export const useAllActionLogsClub = () => {
    return useLazyQuery(AllActionLogsClub);
};