import { MutationTuple, useMutation } from "@apollo/client";
import { GenerateMatchNews } from "../../";

interface VariableProps {
    id_match: string;
    publish?: boolean;
    id_team?: string;
    id_club?: string;
}

export const useGenerateMatchNews = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(GenerateMatchNews);
};
