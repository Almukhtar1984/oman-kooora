import { MutationTuple, useMutation } from "@apollo/client";
import { DraftNews } from "../../";

interface VariableProps {
    content: { text: string; mode?: string; category?: string; };
}

export const useDraftNews = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DraftNews);
};
