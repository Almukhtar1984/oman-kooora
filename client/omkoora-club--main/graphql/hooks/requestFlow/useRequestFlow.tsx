import { LazyQueryResultTuple, useLazyQuery } from "@apollo/client";
import { RequestFlowTrack } from "../../";

interface VariableProps {
    entity_type: string;
    entity_id: string;
}

export const useRequestFlow = (): LazyQueryResultTuple<any, VariableProps> => {
    return useLazyQuery<any, VariableProps>(RequestFlowTrack);
};
