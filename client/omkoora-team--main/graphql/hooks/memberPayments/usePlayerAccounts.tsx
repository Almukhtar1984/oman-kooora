import {useLazyQuery} from "@apollo/client";
import {PlayerAccounts} from "../..";

export const usePlayerAccounts = () => {
    return useLazyQuery(PlayerAccounts);
};
