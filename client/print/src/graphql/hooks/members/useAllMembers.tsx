import {useLazyQuery} from "@apollo/client";
import {AllMembers} from "../../"

export const useAllMembers = () => {
    return useLazyQuery(AllMembers);
};