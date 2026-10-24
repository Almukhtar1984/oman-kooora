import { LazyQueryResultTuple, useLazyQuery } from "@apollo/client";
import { AllPlayerReleases } from "../../";

interface VariableProps {
    idTeam?: string;
    status?: string;
}

export const useAllPlayerReleases = (): LazyQueryResultTuple<any, VariableProps> => {
    return useLazyQuery<any, VariableProps>(AllPlayerReleases);
};
