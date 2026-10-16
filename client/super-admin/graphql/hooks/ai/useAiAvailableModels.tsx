import { useLazyQuery } from "@apollo/client";
import { AI_AVAILABLE_MODELS } from "../../";

// Lazy: fired by the "تحديث الموديلات" button, not on page load.
export const useAiAvailableModels = () => {
    return useLazyQuery(AI_AVAILABLE_MODELS, { fetchPolicy: "network-only" });
};
