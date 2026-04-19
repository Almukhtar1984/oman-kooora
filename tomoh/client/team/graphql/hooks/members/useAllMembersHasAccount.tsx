import {useLazyQuery, useQuery} from "@apollo/client";
import {AllMembersHasAccount} from "../../"

interface Props {}

export const useAllMembersHasAccount = () => {
    return useLazyQuery(AllMembersHasAccount);
};