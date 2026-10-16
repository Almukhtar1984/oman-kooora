import { useQuery } from "@apollo/client";
import { AI_MATCH_CANDIDATES } from "../../";

export const useAiMatchCandidates = (limit = 20) => {
    return useQuery(AI_MATCH_CANDIDATES, { variables: { limit }, fetchPolicy: "network-only" });
};
