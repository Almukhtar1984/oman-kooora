import { useLazyQuery } from "@apollo/client";
import { AiMatchCandidates } from "../../";

export const useAiMatchCandidates = () => {
    return useLazyQuery(AiMatchCandidates, { fetchPolicy: "network-only" });
};
