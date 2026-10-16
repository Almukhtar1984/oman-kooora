import { useQuery } from "@apollo/client";
import { AI_SETTINGS } from "../../";

export const useAiSettings = () => {
    return useQuery(AI_SETTINGS, { fetchPolicy: "network-only" });
};
