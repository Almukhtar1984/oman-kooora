import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteAttachmentTechnical} from "../../";

interface VariableProps {
    id?: string;
}

export const useDeleteAttachmentTechnical = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteAttachmentTechnical);
};
