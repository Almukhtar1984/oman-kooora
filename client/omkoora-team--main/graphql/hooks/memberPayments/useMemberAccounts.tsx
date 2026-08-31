import {useLazyQuery} from "@apollo/client";
import {MemberAccounts} from "../../";

export const useMemberAccounts = () => {
    return useLazyQuery(MemberAccounts);
};
