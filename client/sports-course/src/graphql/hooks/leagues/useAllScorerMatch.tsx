import { useLazyQuery } from "@apollo/client";
import { AllScorerMatch } from "../../";


export const useAllScorerMatch = () => {
    return useLazyQuery(AllScorerMatch);
};