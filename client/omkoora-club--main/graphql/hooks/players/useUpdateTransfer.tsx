import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateTransfer, } from "../../"


interface VariableProps {
    id?:          string;
    content: {
        status: string;
        id_team_from?: string;
        id_team_to?: string | null;
        id_player?: string;
        // سبب الرفض — يُكتب في خطّ تتبّع الطلب.
        note?: string;
    };
}

export const useUpdateTransfer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateTransfer);
};