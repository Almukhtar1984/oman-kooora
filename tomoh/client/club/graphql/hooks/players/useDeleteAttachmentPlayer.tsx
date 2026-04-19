import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteAttachmentPlayer} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteAttachmentPlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteAttachmentPlayer);
};