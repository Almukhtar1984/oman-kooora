import {useLazyQuery} from "@apollo/client";
import {PlayerPayments} from "../../";

export const usePlayerPayments = () => {
    return useLazyQuery(PlayerPayments);
};
