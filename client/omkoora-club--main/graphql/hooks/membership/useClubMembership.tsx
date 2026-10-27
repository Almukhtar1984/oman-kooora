import { LazyQueryResultTuple, useLazyQuery } from "@apollo/client";
import { ClubMembership } from "../../";

interface VariableProps {
    kind?: string | null;
    status?: string | null;
    search?: string | null;
    page?: number;
    limit?: number;
}

export const useClubMembership = (): LazyQueryResultTuple<any, VariableProps> => {
    return useLazyQuery<any, VariableProps>(ClubMembership);
};
