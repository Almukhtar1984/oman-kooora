import {MutationTuple, useMutation} from "@apollo/client";
import {AddAttachmentTechnical} from "../../";

interface VariableProps {
    attachments?: any;
    idTechnical?: string;
}

export const useAddAttachmentTechnical = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddAttachmentTechnical);
};
