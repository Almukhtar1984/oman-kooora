import { LazyQueryResultTuple, useLazyQuery } from "@apollo/client";
import { RequestPayments } from "../../";

interface VariableProps {
    status?: string | null;
    idTeam?: string | null;
}

export const useRequestPayments = (): LazyQueryResultTuple<any, VariableProps> => {
    return useLazyQuery<any, VariableProps>(RequestPayments);
};
