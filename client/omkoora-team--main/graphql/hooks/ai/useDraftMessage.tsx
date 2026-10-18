import { MutationTuple, useMutation } from "@apollo/client";
import { DraftMessage } from "../../";

interface VariableProps {
    content: {
        brief: string;
        tone?: string;           // formal | friendly | firm
        recipientType?: string;  // club | team
        recipientName?: string;
    };
}

export const useDraftMessage = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DraftMessage);
};
