import { useLazyQuery } from "@apollo/client";
import { League } from "../../";


export const useLeague = () => {
    return useLazyQuery(League);
};