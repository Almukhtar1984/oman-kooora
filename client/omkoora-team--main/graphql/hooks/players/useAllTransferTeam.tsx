import {useLazyQuery, useQuery} from "@apollo/client";
import {AllTransferTeam} from "../../"

interface Props {}

export const useAllTransferTeam = () => {
    return useLazyQuery(AllTransferTeam);
};