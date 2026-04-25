import { useLazyQuery } from "@apollo/client";
import { AllLeagues } from "../../";


export const useAllLeagues = () => {
    return useLazyQuery(AllLeagues);
};