import {useLazyQuery, useQuery} from "@apollo/client";
import {AllRequests} from "../../"

interface Props {}

export const useAllRequests = () => {
    return useLazyQuery(AllRequests);
};