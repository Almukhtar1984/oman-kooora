import {useLazyQuery, useQuery} from "@apollo/client";
import {AllRequests} from "../../queries";

interface Props {}

export const useAllRequests = () => {
    return useLazyQuery(AllRequests);
};