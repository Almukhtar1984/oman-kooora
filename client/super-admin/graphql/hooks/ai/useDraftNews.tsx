import { MutationTuple, useMutation } from "@apollo/client";
import { DRAFT_NEWS } from "../../";

interface VariableProps {
    content: {
        text: string;
        mode?: string;      // draft | reformulate | improve
        category?: string;  // news | competitions | players | clubs
    };
}

export const useDraftNews = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DRAFT_NEWS);
};
