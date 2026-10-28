import { QueryResult, useQuery } from "@apollo/client";
import { RequestFlowStages } from "../../";

// المراحل ثابتة، فتُجلب مرة وتبقى في المخزن.
export const useRequestFlowStages = (): QueryResult<any, {}> => {
    return useQuery<any, {}>(RequestFlowStages, { fetchPolicy: "cache-first" });
};
