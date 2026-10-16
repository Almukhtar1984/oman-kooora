import { MutationTuple, useMutation } from "@apollo/client";
import { GENERATE_MATCH_NEWS } from "../../";

interface VariableProps {
    id_match: string;
    publish?: boolean;
}

export const useGenerateMatchNews = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(GENERATE_MATCH_NEWS);
};
