import { LazyQueryResultTuple, useLazyQuery } from "@apollo/client";
import { MyRequestFlows } from "../../";

interface VariableProps {
    stage?: string | null;
    request_type?: string | null;
}

export const useMyRequestFlows = (): LazyQueryResultTuple<any, VariableProps> => {
    return useLazyQuery<any, VariableProps>(MyRequestFlows);
};
