import {useLazyQuery, useQuery} from "@apollo/client";
import {AllMembers} from "../../"

interface Props {}

export const useAllMembers = () => {
    return useLazyQuery(AllMembers);
};