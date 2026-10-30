import { MutationTuple, useMutation } from "@apollo/client";
import { DraftMatchNews } from "../../";

interface VariableProps {
    id_match: string;
}

export const useDraftMatchNews = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DraftMatchNews);
};
