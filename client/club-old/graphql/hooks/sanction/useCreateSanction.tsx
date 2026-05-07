import { MutationTuple, useMutation } from "@apollo/client";
import { CreateSanction } from "../../";

interface VariableProps {
    content: {
        note: string;
        id_player: string;
        date_from: string;
        date_to: string;
    };
}

export const useCreateSanction = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CreateSanction);
};
