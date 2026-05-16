import { QueryHookOptions, useQuery } from "@apollo/client";
import { AllLeagues } from "../../";


export const useAllLeagues = (options?: QueryHookOptions) => {
    return useQuery(AllLeagues, options);
};
