import { MutationTuple, useMutation } from "@apollo/client";
import { DraftMessage } from "../../";

interface VariableProps {
    content: { brief: string; tone?: string; recipientType?: string; recipientName?: string; };
}

export const useDraftMessage = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DraftMessage);
};
